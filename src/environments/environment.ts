export const environment = {
  production: false,
  // Using http (not https) on 5172 to avoid the browser blocking requests
  // over the .NET dev HTTPS certificate (self-signed, untrusted by default).
  // Switch to the https://localhost:7087 profile once a trusted cert is set up.
  apiUrl: 'http://localhost:5172/api'
};
