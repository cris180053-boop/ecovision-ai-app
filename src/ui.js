import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Rect, Stop, SvgXml } from 'react-native-svg';
import { logo } from './logo';

export const colors = {
  background: '#050706',
  panel: '#0A0E0C',
  elevated: '#111813',
  line: '#26332B',
  text: '#EEF2EE',
  muted: '#A4B1A8',
  dim: '#7D9084',
  green: '#22C55E',
  bright: '#86EFAC',
  onGreen: '#04140A',
};

const icons = {
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  back: 'M20 12H5m6 6-6-6 6-6',
  chevron: 'm6 9 6 6 6-6',
  camera: 'M8 6l1.5-2h5L16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z M15.5 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z',
  photo: 'M4 4h16v16H4z M4 17l5-5 4 4 3-3 4 4 M16 8h.01',
  scan: 'M3 8V3h5m8 0h5v5m0 8v5h-5m-8 0H3v-5m4-4h10',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2',
  guide: 'M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1v14',
  check: 'm5 12 4 4L19 6',
  info: 'M12 10v6m0-9h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
  recycle: 'm7 8 2-4a2 2 0 0 1 3.5 0l3 5m-4-1 4.5 1.5 1-4.5m2 6 2 3a2 2 0 0 1-1.7 3H13m3-3-3 3 3 3M7 21H5a2 2 0 0 1-1.7-3l3.3-5m-4 .8 4-1.3 1.3 4.2',
};

export function Icon({ name, color = colors.bright, size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={icons[name]} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function Mono({ children, style }) {
  return <Text style={[styles.mono, style]}>{children}</Text>;
}

export function Brand({ step }) {
  const steps = ['ACCESO', 'CAPTURA', 'RESULTADO'];
  return (
    <View style={styles.header}>
      <View style={styles.wordmark} accessible accessibilityLabel="EcoVision AI">
        <SvgXml xml={logo} width={31} height={31} />
        <Text style={styles.brandName}>EcoVision</Text>
        <Text style={styles.brandBadge}>AI</Text>
      </View>
      <View style={styles.step}>
        <Mono style={styles.stepText}>{'0' + step} / 03</Mono>
        <View style={styles.stepTrack} accessibilityLabel={steps[step - 1]}>
          {steps.map((label, index) => <View key={label} style={[styles.stepLine, index < step && styles.stepActive]} />)}
        </View>
      </View>
    </View>
  );
}

export function Button({ label, onPress, icon, secondary = false, disabled = false, busy = false, style }) {
  const color = secondary ? colors.text : colors.onGreen;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, pressed && styles.pressed, disabled && !busy && styles.disabled, style]}
    >
      {busy ? <ActivityIndicator color={color} /> : icon && <Icon name={icon} color={color} size={19} />}
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function DropDown({ label, options, value, onChange, icon, disabled = false }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View>
      <Mono style={styles.fieldLabel}>{label.toUpperCase()}</Mono>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label + ', ' + value.label}
        accessibilityState={{ expanded, disabled }}
        disabled={disabled}
        onPress={() => setExpanded(open => !open)}
        style={styles.select}
      >
        {icon && <Icon name={icon} color={colors.dim} size={17} />}
        <Text style={styles.selectValue}>{value.label}</Text>
        <View style={expanded && styles.up}><Icon name="chevron" color={colors.muted} size={18} /></View>
      </Pressable>
      {expanded && (
        <View style={styles.options}>
          {options.map(option => (
            <Pressable
              key={option.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: value.label === option.label, disabled }}
              disabled={disabled}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => { onChange(option); setExpanded(false); }}
            >
              <Text style={styles.selectValue}>{option.label}</Text>
              {value.label === option.label && <Icon name="check" size={17} />}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export function Viewfinder() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
        <Path d="M5 15V5h10m70 0h10v10m0 70v10H85m-70 0H5V85" stroke="#86EFAC" strokeWidth={0.6} />
        <Path d="M46 50h8m-4-4v8" stroke="#86EFAC" opacity={0.7} strokeWidth={0.3} />
      </Svg>
    </View>
  );
}

export function ScanArt() {
  return (
    <View style={styles.art} accessible={false} importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 360 174" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="glow">
            <Stop offset="0" stopColor="#204D2F" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#08100B" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="360" height="174" fill="#080F0B" />
        {[36, 72, 108, 144, 180, 216, 252, 288, 324].map(x => <Line key={x} x1={x} y1="0" x2={x} y2="174" stroke="#17251C" strokeWidth=".5" />)}
        {[29, 58, 87, 116, 145].map(y => <Line key={y} x1="0" y1={y} x2="360" y2={y} stroke="#17251C" strokeWidth=".5" />)}
        <Rect width="360" height="174" fill="url(#glow)" />
        <Circle cx="180" cy="87" r="66" stroke="#4ADE80" strokeOpacity=".28" strokeDasharray="1 4" fill="none" />
        <Circle cx="180" cy="87" r="54" stroke="#4ADE80" strokeOpacity=".18" fill="none" />
        <Path d="M11 27V11h16m306 0h16v16m0 120v16h-16m-306 0H11v-16" fill="none" stroke="#4ADE80" strokeOpacity=".65" />
        <Path d="M38 87h84m116 0h84" stroke="#4ADE80" strokeOpacity=".25" />
      </Svg>
      <View style={styles.artLogo}><SvgXml xml={logo} width={102} height={102} /></View>
      <Mono style={styles.artMark}>EV / 01</Mono>
      <Mono style={styles.artMode}>VISIÓN ARTIFICIAL</Mono>
    </View>
  );
}

const styles = StyleSheet.create({
  mono: { color: colors.dim, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11, letterSpacing: 0.6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandName: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.7 },
  brandBadge: { color: colors.onGreen, backgroundColor: colors.green, fontWeight: '900', fontSize: 11, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  step: { gap: 5, alignItems: 'flex-end' },
  stepText: { color: colors.muted, fontSize: 10 },
  stepTrack: { flexDirection: 'row', gap: 3 },
  stepLine: { height: 3, width: 14, borderRadius: 2, backgroundColor: colors.line },
  stepActive: { backgroundColor: colors.green },
  button: { minHeight: 52, borderRadius: 12, backgroundColor: colors.green, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  secondary: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.elevated },
  pressed: { opacity: 0.77 },
  disabled: { opacity: 0.45 },
  buttonText: { fontSize: 15, fontWeight: '800', flexShrink: 1, textAlign: 'center' },
  fieldLabel: { color: colors.muted, marginBottom: 7 },
  select: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 10, backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.line },
  selectValue: { color: colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
  up: { transform: [{ rotate: '180deg' }] },
  options: { marginTop: 5, borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.elevated, overflow: 'hidden' },
  option: { minHeight: 46, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  optionPressed: { backgroundColor: '#1A2C20' },
  art: { height: 158, borderRadius: 15, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', backgroundColor: colors.panel },
  artLogo: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  artMark: { position: 'absolute', top: 17, left: 18, color: colors.bright, fontSize: 9 },
  artMode: { position: 'absolute', bottom: 17, right: 18, color: colors.bright, fontSize: 9 },
});
