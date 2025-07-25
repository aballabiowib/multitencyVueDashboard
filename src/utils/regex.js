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

// Regex per email
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// MODIFICATO QUI: usernameRegex ora usa la stessa regex dell'email
export const usernameRegex = emailRegex; 
