export const materials = [
  {
    label: 'Plástico PET',
    color: '#4FB3F6',
    instruction: 'Si es un envase PET aceptado, vacíalo y sepáralo con los plásticos PET.',
  },
  {
    label: 'Metal/ Aluminio',
    color: '#A9B2B8',
    instruction: 'Vacía el envase y sepáralo con los metales que acepte tu sistema de reciclaje.',
  },
  {
    label: 'Papel y cartón',
    color: '#D5AA79',
    instruction: 'Separa el papel o cartón limpio y seco. Si es una caja, aplástala para reducir el volumen.',
  },
];

export const destinations = [
  { label: 'Hogar', note: 'Consulta qué materiales recibe el punto limpio de tu comuna.' },
  { label: 'Punto limpio', note: 'Sigue la señalización del contenedor y las indicaciones del personal.' },
  { label: 'Planta de reciclaje', note: 'Deriva el residuo al flujo indicado por el protocolo de tu planta.' },
];

const minimumConfidence = 60;

export function getResult(predictions, threshold, destination) {
  if (!Array.isArray(predictions) || predictions.length !== materials.length) {
    throw new Error('La salida del modelo está incompleta.');
  }

  const scores = materials.map(material => {
    const prediction = predictions.find(item => item?.className?.trim() === material.label);
    const probability = prediction?.probability;
    if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
      throw new Error('El modelo devolvió un puntaje inválido.');
    }
    return { ...material, probability, percent: Math.round(probability * 100) };
  });
  const best = scores.reduce((top, entry) => entry.probability > top.probability ? entry : top);

  if (best.percent < minimumConfidence) {
    return {
      scores, best, threshold, destination,
      status: 'Identificación incierta', color: '#FB8585', background: '#241616',
      title: 'Vuelve a escanear',
      advice: 'Fotografía un solo objeto, de frente y con buena luz. Revisa si corresponde a uno de los tres materiales entrenados.',
    };
  }
  if (best.percent < threshold) {
    return {
      scores, best, threshold, destination,
      status: 'Revisión recomendada', color: '#FACC66', background: '#211C11',
      title: 'Verifica el material',
      advice: 'Revisa el símbolo o la etiqueta del envase. Puedes tomar otra foto con el objeto centrado antes de separarlo.',
    };
  }
  return {
    scores, best, threshold, destination,
    status: 'Confianza alta', color: '#86EFAC', background: '#102619',
    title: 'Separa el material',
    advice: best.instruction + ' ' + destination.note,
  };
}
