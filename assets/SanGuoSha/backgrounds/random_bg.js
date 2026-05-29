(function () {
    const bgs = [
        '../assets/SanGuoSha/backgrounds/board_bg.png',
        '../assets/SanGuoSha/backgrounds/board_bg2.jpg',
        '../assets/SanGuoSha/backgrounds/board_bg3.jpg',
        '../assets/SanGuoSha/backgrounds/board_bg4.jpg',
        '../assets/SanGuoSha/backgrounds/board_bg5.jpg',
        '../assets/SanGuoSha/backgrounds/board_bg6.png',
        '../assets/SanGuoSha/backgrounds/board_bg7.png'
    ];
    const randomBg = bgs[Math.floor(Math.random() * bgs.length)];

    document.addEventListener("DOMContentLoaded", () => {
        // Set background image
        document.body.style.backgroundImage = `url('${randomBg}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';

        // Ensure the background color doesn't override the image entirely 
        // We can add a semi-transparent dark overlay using a pseudo-element or box-shadow
        // to make sure text remains readable on all games.
        // But since we can't easily add pseudo-elements inline, we'll use a background blend mode
        // if the body already has a background color.
        document.body.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
        document.body.style.backgroundBlendMode = 'overlay';
    });
})();
