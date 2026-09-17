// só o basico é o essencial!
document.addEventListener('DOMContentLoaded', () => {
    const btnInfo = document.getElementById('btnInfo');
    const textoInfo = document.getElementById('textoInfo');

    if (btnInfo && textoInfo) {
        btnInfo.addEventListener('click', () => {
            // Alterna entre mostrar e esconder a caixa de texto
            const visivel = textoInfo.style.display === 'block';
            textoInfo.style.display = visivel ? 'none' : 'block';
            btnInfo.setAttribute('aria-expanded', String(!visivel));
        });
    }
});﻿
