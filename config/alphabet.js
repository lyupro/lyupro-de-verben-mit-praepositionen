// config/alphabet.js

const alphabet = {
    regular: 'abcdefghijklmnopqrstuvwxyz'.split(''),
    special: ['ae', 'oe', 'ue', 'ss'],
    getAll() {
        return [...this.regular, ...this.special];
    },
    getDbKey(letter) {
        if (this.regular.includes(letter)) {
            return letter;
        }
        switch (letter) {
            case 'ä': return 'ae';
            case 'ö': return 'oe';
            case 'ü': return 'ue';
            case 'ß': return 'ss';
            default: return letter;
        }
    },
    getDisplayLetter(dbKey) {
        switch (dbKey) {
            case 'ae': return 'ä';
            case 'oe': return 'ö';
            case 'ue': return 'ü';
            case 'ss': return 'ß';
            default: return dbKey;
        }
    }
};

export default alphabet;