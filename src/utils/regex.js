// src/utils/regex.js

// Regex per nomi e cognomi (caratteri latini, spazi, trattini, apostrofi)
// Questa regex è più compatibile e include lettere latine (maiuscole e minuscole),
// spazi, trattini e apostrofi.
export const nameRegex = /^[a-zA-Z\s-']+$/;

// Regex per numeri di telefono (numeri, spazi, trattini, parentesi, più/meno)
// Supporta formati internazionali comuni come +XX XXX XXX XXXX o (XXX) XXX-XXXX
export const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

// Regex per password:
// Minimo 8 caratteri
// Almeno una lettera maiuscola (?=.*[A-Z])
// Almeno una lettera minuscola (?=.*[a-z])
// Almeno un numero (?=.*\d)
// Almeno un carattere speciale (es. !@#$%^&*()_+-=[]{};':"|,.<>/?`~) (?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/;

// Regex per un singolo indirizzo email valido
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// usernameRegex ora usa la stessa regex dell'email
export const usernameRegex = emailRegex;

// Regex per il titolo dell'email: lettere maiuscole/minuscole, numeri, spazi, trattini, underscore, punti
export const titleRegex = /^[a-zA-Z0-9\s\-_.]*$/;

// Nuova regex specifica per l'oggetto della mail che gestisce il simbolo '$'
export const titleObjectEmail = /^[a-zA-Z0-9_$-.\s]+$/;


// Regex per uno o più indirizzi email validi, separati da virgola (con spazi opzionali)
// Esempio: "test@example.com, another.user@domain.net"
export const multipleEmailsRegex = /^([^\s@]+@[^\s@]+\.[^\s@]+)(\s*,\s*[^\s@]+@[^\s@]+\.[^\s@]+)*$/;

// Nuove Regex aggiunte:

// Regex per nomi di azienda e indirizzi: lettere, numeri, spazi, trattini, underscore, parentesi tonde
export const companyNameAddressRegex = /^[a-zA-Z0-9\s\-_()]*$/;

// Regex per Partita IVA e Codice Fiscale: numeri, lettere (maiuscole/minuscole), trattino
export const vatFiscalCodeRegex = /^[a-zA-Z0-9-]*$/;

// Regex per numeri float (latitudine/longitudine): un numero iniziale, un punto e un numero finale (es. 12.34, -5.6)
export const floatNumberRegex = /^-?\d+\.\d+$/;
