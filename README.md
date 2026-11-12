# EcoVision AI

**El ojo inteligente que acelera el reciclaje.**

Prototipo móvil de tres pantallas para identificar un residuo con la cámara del teléfono. Usa el modelo original de EcoVision AI, entrenado en Teachable Machine. El logo, el ícono y los colores se basan en la web del proyecto.

## Abrir en Expo Go

1. Instala [Node.js 24 LTS](https://nodejs.org/) en el computador y [Expo Go](https://expo.dev/go) en el teléfono. Este proyecto usa Expo SDK 58.0.0.
2. Descomprime el ZIP y abre una terminal en la carpeta `EcoVision-AI`.
3. Ejecuta estos comandos. El primero se hace una vez por instalación.

   ```sh
   npm ci
   npm start -- --go --clear
   ```

4. Conecta el teléfono y el computador a la misma red Wi-Fi. Escanea el QR de la terminal con la cámara del iPhone o con el lector de Expo Go en Android. Mantén la terminal abierta durante la demostración.

Si la red de la sala aísla los dispositivos, usa una red compartida en la que ambos puedan comunicarse. Expo Go necesita conectarse al computador para abrir esta versión. El modelo y los recursos de inferencia se incluyen en el proyecto y las fotos se procesan en el teléfono.

## Demostración en tres pantallas

1. **Bienvenida.** Selecciona Operador/a o Visitante. Abre **Cómo usar EcoVision AI** para ver la guía y toca **Ingresar al escáner**.
2. **Panel operativo.** Activa la cámara y concede el permiso. Centra un solo residuo con buena luz. También puedes elegir una foto. Selecciona el contexto de separación y mueve el deslizador de confianza. Toca **Clasificar con IA**.
3. **Resultados.** Muestra el material más probable, el puntaje de las tres clases, el umbral aplicado y la orientación de separación. Toca **Escanear otro residuo** para repetir el flujo.

Para la presentación, lleva una botella PET, una lata y papel o cartón limpio. Prueba las tres muestras en el teléfono que usarás en la sala y confirma que la cámara y la conexión Wi-Fi funcionen allí.

## Semáforo y alcance

| Estado | Regla |
| --- | --- |
| Verde · Confianza alta | El puntaje alcanza el umbral elegido. |
| Amarillo · Revisión recomendada | El puntaje es de al menos 60% y queda por debajo del umbral elegido. |
| Rojo · Identificación incierta | El puntaje queda por debajo de 60%. |

El deslizador modifica el criterio de aceptación entre 60% y 95%. El contexto de separación adapta la indicación cuando el resultado es verde. Las dos opciones conservan los puntajes que devuelve el modelo.

El modelo distingue **Plástico PET**, **Metal/ Aluminio** y **Papel y cartón**. Compara cualquier foto con esas tres clases. Un objeto ajeno a ellas también puede recibir un puntaje alto, así que conviene verificar el material antes de separarlo. El puntaje es la salida del modelo para esa foto.

## Origen del modelo

- [Web original de EcoVision AI](https://aguscharpentier.github.io/ecovision-ai/)
- [Modelo y pesos originales](https://github.com/aguscharpentier/ecovision-ai/tree/main/model)
- El motor local incluye TensorFlow.js 1.3.1 y Teachable Machine Image 0.8.5, las versiones utilizadas por el clasificador web del proyecto.
- [Preparación de un teléfono para Expo Go](https://docs.expo.dev/get-started/set-up-your-environment/)
