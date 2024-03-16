declare module 'unixpass';


interface ISmsController {
  msg: string;
  to: string;
  sendSms: (opts: { message: string; recipient: string }) => Promise<void>;
  reboot: () => Promise<void>;
}


