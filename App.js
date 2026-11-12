import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, AppState, BackHandler, Image, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import Slider from '@react-native-community/slider';
import { destinations, getResult, materials } from './src/classification';
import { ModelEngine } from './src/ModelEngine';
import { Brand, Button, colors, DropDown, Icon, Mono, ScanArt, Viewfinder } from './src/ui';

const profiles = [{ label: 'Operador/a' }, { label: 'Visitante' }];
const guide = [
  ['Enfoca un residuo', 'Ubica un solo objeto dentro del recuadro y usa buena luz. También puedes elegir una foto.'],
  ['Clasifica con IA', 'Elige el contexto y ajusta el mínimo de confianza para mostrar un resultado verde.'],
  ['Revisa el resultado', 'Compara los puntajes y sigue la orientación de separación según el material.'],
];

function Welcome({ onEnter, profile, setProfile }) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      <View style={styles.intro}>
        <Mono style={styles.kicker}>RECICLAJE ASISTIDO POR IA</Mono>
        <Text accessibilityRole="header" style={styles.heroTitle}>El ojo inteligente que acelera el reciclaje</Text>
        <Text style={styles.body}>Identifica el material de un residuo con la cámara de tu celular.</Text>
      </View>

      <ScanArt />
      <View style={styles.chips}>
        {materials.map(material => (
          <View key={material.label} style={styles.chip}>
            <View style={[styles.dot, { backgroundColor: material.color }]} />
            <Text style={styles.chipText}>{material.label === 'Metal/ Aluminio' ? 'Metal / aluminio' : material.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeading}>
          <Text style={styles.panelTitle}>Acceso de demostración</Text>
          <Mono style={styles.microTag}>DEMO</Mono>
        </View>
        <DropDown label="Perfil" options={profiles} value={profile} onChange={setProfile} icon="user" />
        <Button label="Ingresar al escáner" onPress={onEnter} icon="arrow" />
      </View>

      <View style={styles.guide}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showGuide }}
          onPress={() => setShowGuide(open => !open)}
          style={styles.guideToggle}
        >
          <Icon name="guide" size={18} />
          <Text style={styles.guideTitle}>Cómo usar EcoVision AI</Text>
          <View style={showGuide && styles.flipped}><Icon name="chevron" size={18} color={colors.muted} /></View>
        </Pressable>
        {showGuide && guide.map(([title, description], index) => (
          <View key={title} style={styles.guideRow}>
            <Mono style={styles.kicker}>{'0' + (index + 1)}</Mono>
            <View style={styles.guideText}>
              <Text style={styles.smallTitle}>{title}</Text>
              <Text style={styles.small}>{description}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function Result({ result, photo, onAgain }) {
  return (
    <>
      <View style={styles.intro}>
        <Mono style={styles.kicker}>LECTURA COMPLETADA</Mono>
        <Text accessibilityRole="header" style={styles.title}>Resultado del análisis</Text>
      </View>

      <View style={[styles.resultCard, { backgroundColor: result.background, borderColor: result.color + '55' }]}>
        <View style={styles.statusLine}>
          <View style={[styles.dot, { backgroundColor: result.color }]} />
          <Mono style={{ color: result.color }}>{result.status.toUpperCase()}</Mono>
        </View>
        <View style={styles.resultOverview}>
          <View style={styles.overviewText}>
            <Text style={styles.small}>Material más probable</Text>
            <Text style={styles.material}>{result.best.label}</Text>
          </View>
          <Image source={{ uri: photo }} style={styles.thumbnail} accessibilityLabel="Foto analizada" />
        </View>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={[styles.number, { color: result.color }]}>{result.best.percent}%</Text>
            <Text style={styles.small}>Confianza del modelo</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.number}>{result.threshold}%</Text>
            <Text style={styles.small}>Umbral para verde</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Confianza por material</Text>
        {result.scores.map(score => (
          <View key={score.label} accessible accessibilityLabel={score.label + ', ' + score.percent + ' por ciento'}>
            <View style={styles.barHeading}>
              <Text style={styles.smallTitle}>{score.label}</Text>
              <Mono style={styles.barValue}>{score.percent}%</Mono>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: score.percent + '%', backgroundColor: score.color }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.recommendationHeading}>
          <Icon name="recycle" />
          <Mono style={styles.kicker}>{result.destination.label.toUpperCase()}</Mono>
        </View>
        <Text style={styles.panelTitle}>{result.title}</Text>
        <Text style={styles.body}>{result.advice}</Text>
      </View>

      <Text style={styles.small}>El modelo siempre compara la foto con tres clases. Un objeto fuera de esas clases también puede recibir un puntaje alto.</Text>
      <Button label="Escanear otro residuo" icon="scan" onPress={onAgain} />
    </>
  );
}

function removeTemp(uri) {
  if (!uri) return;
  try { new File(uri).delete(); } catch { /* Expo también puede limpiar la caché. */ }
}

function EcoVision() {
  const { width, height } = useWindowDimensions();
  const previewSize = Math.min(width - 40, Math.max(180, height * 0.33), 410);
  const [screen, setScreen] = useState(1);
  const [profile, setProfile] = useState(profiles[0]);
  const [destination, setDestination] = useState(destinations[0]);
  const [threshold, setThreshold] = useState(80);
  const [engine, setEngine] = useState('loading');
  const [engineVersion, setEngineVersion] = useState(0);
  const [active, setActive] = useState(AppState.currentState !== 'background');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState(null);
  const camera = useRef(null);
  const model = useRef(null);
  const working = useRef(false);

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state !== 'active') setCameraReady(false);
      setActive(state === 'active');
    });
    return () => listener.remove();
  }, []);

  function goTo(target) {
    setError('');
    setCameraReady(false);
    if (target === 1) {
      setCameraActive(false);
      setSelected(null);
      setOutput(null);
    }
    setScreen(target);
  }

  function nextScan() {
    setSelected(null);
    setOutput(null);
    goTo(2);
  }

  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (working.current) return true;
      if (screen === 1) return false;
      if (screen === 3) nextScan();
      else goTo(1);
      return true;
    });
    return () => listener.remove();
  }, [screen]);

  async function toggleCamera() {
    if (working.current) return;
    if (cameraActive && !selected) {
      setCameraReady(false);
      setCameraActive(false);
      return;
    }

    working.current = true;
    setSourceBusy(true);
    setError('');
    try {
      if (!permission?.granted) {
        const current = await requestPermission();
        if (!current.granted) {
          setError(current.canAskAgain ? 'Autoriza el uso de la cámara o elige una foto.' : 'Habilita la cámara en Ajustes o elige una foto.');
          return;
        }
      }
      setSelected(null);
      setCameraReady(false);
      setCameraActive(true);
    } catch {
      setError('No pudimos abrir la cámara. Puedes elegir una foto.');
    } finally {
      working.current = false;
      setSourceBusy(false);
    }
  }

  async function choosePhoto() {
    if (working.current) return;
    working.current = true;
    setSourceBusy(true);
    setError('');
    try {
      const response = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (response.canceled) return;
      setCameraReady(false);
      setCameraActive(false);
      setSelected(response.assets[0]);
    } catch {
      setError('No pudimos abrir esa foto. Elige otra o usa la cámara.');
    } finally {
      working.current = false;
      setSourceBusy(false);
    }
  }

  async function classify() {
    if (working.current || engine !== 'ready' || !canAnalyze) return;
    working.current = true;
    setBusy(true);
    setError('');
    let captured;
    let prepared;
    let startedInference = false;
    try {
      captured = selected ?? await camera.current.takePictureAsync({ quality: 0.82 });
      const { uri, width, height } = captured;
      const edit = ImageManipulator.manipulate(uri);
      const side = Math.min(width, height);
      if (side > 0) {
        edit.crop({ originX: Math.floor((width - side) / 2), originY: Math.floor((height - side) / 2), width: side, height: side });
      }
      edit.resize({ width: 320 });
      const image = await edit.renderAsync();
      prepared = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.88, base64: true });
      const photo = 'data:image/jpeg;base64,' + prepared.base64;
      startedInference = true;
      const scores = await model.current.predict(photo);
      setOutput({ result: getResult(scores, threshold, destination), photo });
      goTo(3);
    } catch {
      setError(startedInference
        ? 'No pudimos analizar la imagen. Comprueba el estado del modelo y vuelve a intentarlo.'
        : 'No pudimos preparar la foto. Toma una nueva o elige otra.');
    } finally {
      if (!selected) removeTemp(captured?.uri);
      removeTemp(prepared?.uri);
      setBusy(false);
      working.current = false;
    }
  }

  const showCamera = cameraActive && permission?.granted && active && !selected;
  const canAnalyze = Boolean(selected || (showCamera && cameraReady));
  const locked = busy || sourceBusy;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ModelEngine key={engineVersion} ref={model} onStateChange={setEngine} />

      <View style={styles.headerWrap}><Brand step={screen} /></View>
      <ScrollView key={screen} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {screen === 1 && (
            <Welcome profile={profile} setProfile={setProfile} onEnter={() => goTo(2)} />
          )}

          {screen === 2 && (
            <>
              <View style={styles.scanNav}>
                <Pressable accessibilityRole="button" accessibilityLabel="Volver a bienvenida" onPress={() => goTo(1)} disabled={locked} style={styles.back}>
                  <Icon name="back" size={17} />
                  <Text style={styles.backText}>Inicio</Text>
                </Pressable>
                <Mono style={styles.microTag}>{profile.label.toUpperCase()}</Mono>
              </View>
              <View style={styles.intro}>
                <Mono style={styles.kicker}>ESCÁNER DE RESIDUOS</Mono>
                <Text accessibilityRole="header" style={styles.title}>Clasifica un residuo</Text>
                <Text style={styles.body}>Centra un solo objeto y procura que tenga buena luz.</Text>
              </View>

              <View style={[styles.preview, { width: previewSize }]}>
                {showCamera && (
                  <CameraView
                    ref={camera}
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    onCameraReady={() => setCameraReady(true)}
                    onMountError={() => {
                      setCameraActive(false);
                      setCameraReady(false);
                      setError('La cámara no está disponible. Puedes elegir una foto.');
                    }}
                  />
                )}
                {selected && <Image source={{ uri: selected.uri }} style={StyleSheet.absoluteFill} accessibilityLabel="Foto seleccionada" />}
                {!showCamera && !selected && (
                  <View style={styles.previewEmpty}>
                    <Icon name="scan" size={38} />
                    <Text style={styles.smallTitle}>Captura un residuo</Text>
                    <Text style={styles.small}>PET, metal o papel y cartón</Text>
                  </View>
                )}
                <Viewfinder />
                <View pointerEvents="none" style={styles.previewTag}>
                  <View style={[styles.dot, { backgroundColor: showCamera || selected ? colors.green : colors.dim }]} />
                  <Mono style={styles.previewTagText}>{selected ? 'FOTO' : showCamera ? 'CÁMARA' : 'VISTA PREVIA'}</Mono>
                </View>
              </View>

              <View style={styles.sourceButtons}>
                <Button
                  label={cameraActive && !selected ? 'Pausar cámara' : 'Activar cámara'}
                  icon="camera"
                  secondary
                  onPress={toggleCamera}
                  disabled={locked}
                  style={styles.sourceButton}
                />
                <Button label="Elegir foto" icon="photo" secondary onPress={choosePhoto} disabled={locked} style={styles.sourceButton} />
              </View>
              {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
              {permission && !permission.granted && !permission.canAskAgain && (
                <Button label="Abrir Ajustes" secondary onPress={() => Linking.openSettings().catch(() => setError('Abre Ajustes y busca los permisos de Expo Go.'))} />
              )}

              <View style={styles.panel}>
                <DropDown
                  label="Contexto de separación"
                  options={destinations}
                  value={destination}
                  onChange={setDestination}
                  icon="recycle"
                  disabled={locked}
                />
                <View>
                  <View style={styles.barHeading}>
                    <Mono style={styles.fieldLabel}>CONFIANZA MÍNIMA PARA VERDE</Mono>
                    <Mono style={styles.percent}>{threshold}%</Mono>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={60}
                    maximumValue={95}
                    step={1}
                    value={threshold}
                    onValueChange={setThreshold}
                    minimumTrackTintColor={colors.green}
                    maximumTrackTintColor={colors.line}
                    thumbTintColor={colors.bright}
                    accessibilityLabel="Confianza mínima para verde"
                    disabled={locked}
                  />
                  <View style={styles.barHeading}><Mono>60%</Mono><Mono>95%</Mono></View>
                </View>
              </View>
            </>
          )}

          {screen === 3 && <Result {...output} onAgain={nextScan} />}
        </View>
      </ScrollView>
      {screen === 2 && (
        <View style={styles.footer}>
          <View style={styles.engineLine}>
            {engine === 'loading'
              ? <ActivityIndicator size="small" color={colors.bright} />
              : <View style={[styles.dot, { backgroundColor: engine === 'ready' ? colors.green : '#FB8585' }]} />}
            <Text accessibilityLiveRegion="polite" style={styles.small}>
              {engine === 'loading' ? 'Preparando el modelo…' : engine === 'ready' ? 'Modelo listo · Procesamiento en tu celular' : 'El modelo requiere reiniciarse.'}
            </Text>
          </View>
          {engine === 'error'
            ? <Button label="Reintentar carga del modelo" secondary onPress={() => {
              setEngine('loading');
              setEngineVersion(version => version + 1);
              setError('');
            }} disabled={locked} />
            : <Button label={busy ? 'Analizando…' : 'Clasificar con IA'} icon="scan" busy={busy} disabled={locked || engine !== 'ready' || !canAnalyze} onPress={classify} />}
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider><EcoVision /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  headerWrap: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8 },
  scroll: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 19, paddingBottom: 27 },
  content: { width: '100%', maxWidth: 520, gap: 15 },
  intro: { gap: 8 },
  kicker: { color: colors.bright },
  heroTitle: { color: colors.text, fontSize: 38, lineHeight: 41, fontWeight: '900', letterSpacing: -1.5 },
  title: { color: colors.text, fontSize: 31, lineHeight: 35, fontWeight: '900', letterSpacing: -1 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  small: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  smallTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderColor: colors.line, borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: colors.panel },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  panel: { padding: 14, gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: colors.panel },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  panelTitle: { color: colors.text, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  microTag: { color: colors.bright, backgroundColor: '#14251A', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 5, overflow: 'hidden', fontSize: 10 },
  guide: { borderTopWidth: 1, borderTopColor: colors.line },
  guideToggle: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 47 },
  guideTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  flipped: { transform: [{ rotate: '180deg' }] },
  guideRow: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  guideText: { flex: 1, gap: 2 },
  scanNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 40, marginTop: -8, marginBottom: -4, paddingRight: 12 },
  backText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  preview: { alignSelf: 'center', aspectRatio: 1, backgroundColor: '#0A120D', borderWidth: 1, borderColor: colors.line, borderRadius: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  previewEmpty: { alignItems: 'center', gap: 6, backgroundColor: '#0A120D', paddingHorizontal: 8, zIndex: 1 },
  previewTag: { position: 'absolute', top: 14, left: 15, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#050706DE', borderRadius: 5 },
  previewTagText: { color: colors.bright, fontSize: 9 },
  sourceButtons: { flexDirection: 'row', gap: 8 },
  sourceButton: { flex: 1, paddingHorizontal: 7 },
  fieldLabel: { color: colors.muted, flexShrink: 1 },
  slider: { height: 39, marginHorizontal: -4 },
  percent: { color: colors.bright, fontSize: 13 },
  footer: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 9, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.background },
  engineLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  error: { color: '#FB8585', fontSize: 13, lineHeight: 19 },
  resultCard: { padding: 15, gap: 14, borderWidth: 1, borderRadius: 15 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultOverview: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  overviewText: { flex: 1, gap: 3 },
  material: { color: colors.text, fontSize: 26, lineHeight: 30, fontWeight: '900', letterSpacing: -0.5 },
  thumbnail: { width: 68, height: 68, borderRadius: 9, backgroundColor: colors.panel },
  metrics: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#FFFFFF25' },
  metric: { flex: 1, gap: 2 },
  number: { color: colors.text, fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  barHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  barValue: { color: colors.muted },
  barTrack: { height: 6, borderRadius: 4, overflow: 'hidden', backgroundColor: '#232F27', marginTop: 6 },
  barFill: { height: '100%', borderRadius: 4 },
  recommendationHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
