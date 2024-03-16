# glinet-mqtt-ha

A simple REST api to fetch status data and trigger a restart / reboot of the router with Home Assistant MQTT integration. Written in Node.js using TypeScript and compiling to ES Modules.

Tested with GL.iNet GL-X3000 (4.4.6 firmware)

## Start the server

- run `npm i`
- run `npm run src` to run using TypeScript source files
  - or run `npm run build` and `node .` to run using transpiled ES Module JavaScript

## Setup
Manually set the router admin password in `process.env.GLINET_PASSWORD` or edit the line `private password = "MyPassword";` in `src/controller.ts` file.
Manually set the router host/ip in `process.env.GLINET_HOST` or edit the line `private host = "netgear.aircard";` in `src/controller.ts` file.

## Endpoints

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