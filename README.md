# glinet-mqtt-ha

A lightweight Node.js application providing a Home Assistant GL.iNet router MQTT integration that **periodically polls** a GL.iNet router's `/rpc` REST API and **publishes status and sensor data to Home Assistant** with an optional REST API.

Written in TypeScript, transpiling to ES Modules. Runs in Docker (amd64 and arm64).

Tested with GL.iNet GL-X3000 (4.8.3 firmware)

## Key Features

- Real-time router status monitoring
- Home Assistant MQTT integration
- Optional REST API
- Environment variable-based configuration
- Configurable polling interval

## Docker Compose Example

```yml
services:
  glinet:
    image: ghcr.io/neilflatley/glinet-mqtt-ha/main/arm64:latest
    container_name: glinet
    restart: unless-stopped
    environment:
      - GLINET_HOST=192.168.8.1
      - GLINET_PASSWORD=YourPassword
      - GLINET_API=false
      - MQTT_HOST=mqtt://192.168.8.1
      - MQTT_REFRESH=300
```

## Environment Variables

The `GLINET_PASSWORD` is required in order to connect to the router API
The `MQTT_HOST` is required to use the Home Assistant MQTT integration
Disable the REST API by setting `GLINET_API=false`

| Variable                | Default       | Purpose                                                                |
| ----------------------- | ------------- | ---------------------------------------------------------------------- |
| `GLINET_HOST`           | `192.168.8.1` | Router hostname/IP                                                     |
| `GLINET_PASSWORD`       |               | Router admin password                                                  |
| `GLINET_API`            | `true`        | **Enable HTTP API** (set to `false` to disable)                        |
| `GLINET_SEQUENTIAL_API` | `false`       | Status update requests to GL.iNet API made sequentially or in parallel |
| `MQTT_HOST`             |               | MQTT broker address                                                    |
| `MQTT_REFRESH`          | `5`           | Polling interval (seconds)                                             |

## Home Assistant Device Sensors

### Cellular

| Entity                     | Type          | Description                                                                |
| -------------------------- | ------------- | -------------------------------------------------------------------------- |
| **Connectivity**           | binary_sensor | Overall internet connectivity status (“Connected”/“Disconnected”).         |
| **Connection text**        | sensor        | Human‑readable description of the current cellular connection (e.g. “4G”). |
| **Network**                | sensor        | Carrier name of the active SIM (e.g. “EE”).                                |
| **Service type**           | sensor        | Type of cellular service (e.g. “LTE”).                                     |
| **Signal**                 | sensor        | Numerical signal strength indicator (0‑5).                                 |
| **Signal strength (RSSI)** | sensor        | Received signal strength in dBm.                                           |
| **WWAN band**              | sensor        | Current LTE band (e.g. “LTE FDD”).                                         |
| **IP location**            | sensor        | Public IP address of the device.                                           |
| **Unread SMS**             | sensor        | Number of unread SMS messages.                                             |

### Wi‑Fi

| Entity                | Type   | Description                                                  |
| --------------------- | ------ | ------------------------------------------------------------ |
| **Connected clients** | sensor | Number of devices currently connected to the router’s Wi‑Fi. |
| **Router**            | sensor | Local IP address of the router (e.g. “192.168.8.1”).         |

### Diagnostic

| Entity                | Type          | Description                                               |
| --------------------- | ------------- | --------------------------------------------------------- |
| **Started**           | sensor        | How long the device has been running (e.g. “5 days”).     |
| **Restart**           | button        | Reboot the device from Home Assistant.                    |
| **Battery**           | sensor        | Battery charge level in % (enable if supported)           |
| **Charging**          | binary_sensor | Whether the battery is charging (enable if supported)     |
| **CPU temperature**   | sensor        | Current CPU temperature in °C.                            |
| **Data use**          | sensor        | Total data used (RX + TX) in bytes.                       |
| **Data use (RX)**     | sensor        | Amount of data received (bytes).                          |
| **Data use (TX)**     | sensor        | Amount of data transmitted (bytes).                       |
| **Flash free**        | sensor        | Amount of free flash memory in MiB.                       |
| **Memory available**  | sensor        | Amount of free RAM available for applications in MiB.     |
| **Memory buff/cache** | sensor        | RAM used for buffers and cache in MiB.                    |
| **Memory free**       | sensor        | Unused RAM in MiB.                                        |
| **Memory total**      | sensor        | Total installed RAM in MiB.                               |
| **Memory total used** | sensor        | RAM used by the system in MiB.                            |
| **Memory used**       | sensor        | RAM used by applications in MiB.                          |
| **Send SMS**          | button        | Send an SMS message via the device from Home Assistant.   |
| **SMS recipient**     | text          | Set the recipient phone number to send an SMS message to. |
| **SMS message**       | text          | Set the body of the SMS message.                          |
| **WAN interface**     | sensor        | Name of the active WAN interface (e.g. “modem_0001”).     |

### Track Data Usage

Set up **Utility Meter** helpers in Home Assistant to track the **Data use** sensor, set them to reset monthly on the day your data plan allowance resets.

Change the data unit into your preferred unit (e.g. MiB, GB) in Home Assistant sensor settings.

| Entity             | Reset                  | Description                |
| ------------------ | ---------------------- | -------------------------- |
| **Data allowance** | Monthly(+ offset days) | Monthly data plan usage.   |
| **Data use daily** | Daily                  | Amount of data used today. |

## HTTP API Endpoints

A simple REST API to fetch status data and trigger a restart / reboot of the router

### GET http://{host}:3000/status

Returns status summary

### GET http://{host}:3000/info

Returns device info

### GET http://{host}:3000/login

Set the router admin password in `process.env.GLINET_PASSWORD` or edit the line `private password = "MyPassword";` in `src/controller.ts` file.

Returns the available router data as JSON for the logged in userd)

Check the console logs for failure details

### GET http://{host}:3000/reboot

The admin password is required (as above) to reboot the router. You do not need to call the /login endpoint first.

### GET http://{host}:3000/sms

Get the SMS list from the router

### POST http://{host}:3000/sms
Send an SMS via the router:

`Content-Type: application/json`
```json
{
  "body": "Message from the API!",
  "phone_number": "07000000000"
}
```

## Development

### Start the server

- run `npm i`
- run `npm run src` to run using TypeScript source files
  - or run `npm run build` and `node .` to run using transpiled ES Module JavaScript

### Testing

- `npm run test` — Run tests in watch mode during development
- `npm run test:run` — Run all unit tests once (CI-friendly)
- `npm run test:coverage` — Run tests with coverage report (HTML)
- `npm run test:ci` — Run unit tests with JUnit reporter for CI/CD
- `npm run test:integration` — Run integration tests only
- `npm run test:integration:ci` — Run integration tests with JUnit reporter

### Credentials and other variables

- Edit the npm script in `package.json`, add the variable=value you require after the `cross-env` command, seperate multiple variables with a space. e.g `"src": "cross-env GLINET_HOST=192.168.8.254 GLINET_PASSWORD=YourPassword node --import tsx src/app.ts"`

- Manually set the router admin password in `process.env.GLINET_PASSWORD` or edit the line `private password = "MyPassword";` in `src/controller.ts` file.

- Manually set the router host/ip in `process.env.GLINET_HOST` or edit the line `private host = "192.168.8.254";` in `src/controller.ts` file.
