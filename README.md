# 📱 LegPrio BLE Viewer App

This is a [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) project built to visualize real-time proprioception data sent via BLE by the LegPrio wearable system.

## 🔧 Get Started

1. Clone the repository and navigate to the project:

   ```bash
   git clone https://github.com/martimestre03/App_Legprio.git
   cd App_Legprio
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a custom development build to support BLE:

   > Expo Go **does not support Bluetooth**. You must use a custom build.

   1. Install EAS CLI if you haven't:

      ```bash
      npm install -g eas-cli
      ```

   2. Configure your project:

      ```bash
      eas build:configure
      ```

   3. Build the app:

      ```bash
      eas build --profile development --platform android
      ```

      or for iOS:

      ```bash
      eas build --profile development --platform ios
      ```

   4. Once the build is complete, install it on your phone to test the BLE connection.

---

## 📡 BLE Integration

This app scans and connects to the LegPrio BLE device. Once connected, it listens for characteristic updates in JSON format like:

```json
{
  "t": 12345678,
  "p": -36.4,
  "b": 0.253,
  "s": 0.230,
  "e": 0.310
}
```

- `t`: Absolute timestamp (µs)
- `p`: Position at button press (mm)
- `b`: Button press relative to central sensor (s)
- `s`: Step start time relative (s)
- `e`: Step end time relative (s)

---

## 🖼️ Screenshots

_You can add images of the UI or graphs here:_

![Home Screen](./assets/screens/home.png)  
![BLE Connection](./assets/screens/connection.png)  
![Data Chart](./assets/screens/chart.png)

---

## 📂 Project Structure

- `app/` — Main UI and navigation
- `ble/` — Bluetooth connection logic
- `components/` — Custom UI components
- `store/` — Context and state management
- `utils/` — Helpers for parsing and formatting

---

## 👨‍🔬 Developed By

Martí Mestre  
BSc Electronics & Telecom @UPC / Research Intern @UCI

---

## 📄 License

This project is licensed under the MIT License.
