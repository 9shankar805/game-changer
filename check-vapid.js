// Check VAPID keys
console.log('VAPID Public Key:', process.env.VITE_VAPID_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
console.log('VAPID Private Key:', process.env.VAPID_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
console.log('VAPID Contact:', process.env.VAPID_CONTACT ? '✅ Set' : '❌ Missing');

if (!process.env.VITE_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log('\n❌ VAPID keys missing! Generate new ones:');
  console.log('npm install -g web-push');
  console.log('web-push generate-vapid-keys');
}