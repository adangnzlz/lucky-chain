# Lucky Chain 🎲

**Lucky Chain** es una lotería descentralizada construida sobre Ethereum, que utiliza contratos inteligentes y Chainlink VRF para garantizar la transparencia y la aleatoriedad en la selección de ganadores. Los participantes pueden unirse enviando una pequeña cantidad de ETH, y el contrato seleccionará al azar a un ganador que recibirá todos los fondos acumulados.

## Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Pruebas](#pruebas)
- [Despliegue](#despliegue)
- [Licencia](#licencia)
- [Contribuciones](#contribuciones)
- [Contacto](#contacto)

---

## Características

- **Lotería Descentralizada**: Sin intervención centralizada; todo se maneja a través de un contrato inteligente.
- **Aleatoriedad Verificada**: Utiliza Chainlink VRF (Verifiable Random Function) para garantizar que el ganador se elige de manera justa y aleatoria.
- **Desarrollado con Hardhat**: Usa Hardhat para el desarrollo, pruebas y despliegue del contrato inteligente.
- **Compatible con Redes de Prueba**: Puedes probar la aplicación en redes de prueba como Sepolia antes de lanzarla en la red principal de Ethereum.

---

## Tecnologías usadas

- **Ethereum**: Red blockchain en la que se despliega el contrato.
- **Solidity**: Lenguaje de programación usado para escribir el contrato inteligente.
- **Hardhat**: Herramienta para desarrollo, pruebas y despliegue de contratos en Ethereum.
- **Chainlink VRF**: Protocolo de aleatoriedad verificable para asegurar la imparcialidad en la elección del ganador.
- **RabbyWallet**: Billetera de Ethereum utilizada por los participantes para interactuar con la lotería.
- **Echidna**: Echidna is a fuzzing tool for smart contracts with input generation based on the contract’s ABI (Application Binary Interface). In other words, Echidna generates several random transaction sequences from a smart contract’s ABI and then assesses all of them.

---

## Instalación

Para ejecutar este proyecto localmente, sigue estos pasos:

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/tu-usuario/lucky-chain.git
   cd lucky-chain
   ```

2. **Instala las dependencias del proyecto:**

   Asegúrate de tener Node.js instalado. Luego, ejecuta:

   ```bash
   npm install
   ```

3. **Instala las dependencias de Hardhat:**

   ```bash
   npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers dotenv
   ```

4. **Instala echidna (necesario Docker):**

   ```bash
   docker pull trailofbits/eth-security-toolbox
   ```

---

## Configuración

1.  **Configura las variables de entorno:**

        Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables.

        ```bash

    WALLET_PRIVATE_KEY=
    SEPOLIA_URL=
    VRF_COORDINATOR= # Coordinador en Sepolia
    SUBSCRIPTION_ID= # Id de suscripción de Chainlink
    KEY_HASH= # Key Hash válido para Sepolia
        ```

2.  **Actualiza `hardhat.config.js`:**

    Asegúrate de que el archivo `hardhat.config.js` esté configurado para utilizar las variables de entorno. Esto ya debería estar configurado si seguiste el tutorial de instalación.

---

## Uso

1. **Desplegar el Contrato en la Red Local:**

   Hardhat crea una red local automáticamente cuando ejecutas ciertos comandos. Para desplegar el contrato en la red local:

   ```bash
   npx hardhat run scripts/deploy.js --network hardhat
   ```

2. **Interactuar con el Contrato:**

   Puedes usar Hardhat Console para interactuar con el contrato en la red local:

   ```bash
   npx hardhat console --network hardhat
   ```

   Una vez en la consola, puedes instanciar el contrato y ejecutar funciones como `enter()` para participar o `pickWinner()` para elegir un ganador.

3. **Desplegar en una Red de Prueba (opcional):**

   Para desplegar el contrato en una red de prueba como Rinkeby:

   ```bash
   npx hardhat run scripts/deploy.js --network rinkeby
   ```

   Asegúrate de tener fondos de prueba ETH y LINK en la cuenta de MetaMask para cubrir las transacciones y las solicitudes de aleatoriedad en Chainlink.

---

## Pruebas

Para ejecutar las pruebas del contrato inteligente y asegurar su funcionamiento, utiliza el siguiente comando:

    npx hardhat test

Esto ejecutará todos los tests en la carpeta test/ para verificar que las funciones de la lotería se comporten correctamente (por ejemplo, que los participantes puedan unirse y que el ganador se elija aleatoriamente).

## Despliegue

Si deseas desplegar el contrato en la red principal de Ethereum, sigue estos pasos (¡con precaución!):

1. **Actualiza el archivo .env con las credenciales de un proyecto de Infura y una cuenta de MetaMask que tenga fondos en la red principal.**

2. **Ejecuta el comando de despliegue:**

```bash
  npx hardhat run scripts/deploy.js --network mainnet
```

3. **Asegúrate de que tienes suficiente ETH y LINK en la cuenta, ya que la red principal requiere fondos reales.**

**Nota: Desplegar en la red principal tiene costos de gas significativos y es irreversible. Asegúrate de haber probado completamente el contrato en una red de prueba antes de hacer el despliegue final.\***

## Licencia

Este proyecto está licenciado bajo la MIT License. Consulta el archivo LICENSE para obtener más detalles.
