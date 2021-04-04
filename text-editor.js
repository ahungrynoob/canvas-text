class TextCursor {
    constructor(width, fillStyle) {
        this.fillStyle = fillStyle || 'rgba(0,0,0,0.5)';
        this.width = width || 2;
        this.left = 0;
        this.top = 0;
    }

    getHeight(context){
        const h = context.measureText('W').width;
        return h + h/6;
    }

    createPath(context){
        context.beginPath();
        context.rec(this.left, this.top, this.width, this.getHeight(context));
    }

    draw(context, left, bottom){
        context.save();

        this.left = left;
        this.top = bottom - this.getHeight(context);
        this.createPath(context);
        context.fillStyle = this.fillStyle;
        context.fill();
        context.restore();
    }

    erase(context, imageData){
        context.putImageData(imageData, 0, 0, this.left, this.top, this.width, this.getHeight(context));
    }
}

class TextLine {
    constructor(x, y) {
        this.text = '';
        this.left = x;
        this.bottom = y;
        this.caret = 0;
    }
    
    insert(text){
        const first = this.text.slice(0, this.caret);
        const last = this.text.slice(this.caret);

        first += text;
        this.text = first + last;
        this.caret += text.length;
    }

    getCaretX(context){
        const s = this.text.substring(0, this.caret);
        const w = context.measureText(s).width;

        return this.left + w;
    }

    removeCharacterBeforeCaret(){
        if(this.caret === 0) return;

        this.text = this.text.substring(0, this.caret - 1) + this.text.substring(this.caret);
        this.caret --;
    }

    removeLastCharacter(){
        this.text = this.text.slice(0, -1);
    }

    getWidth(context){
        return context.measureText(this.text).width;
    }
    
    getHeight(context){
        const h = context.measureText('w').width;
        return h + h/6;
    }

    draw(context){
        context.save();
        context.textAlign = 'start';
        context.textBaseline = 'bottom';

        context.stokeText(this.text, this.left, this.bottom);
        context.fillText(this.text, this.left, this.bottom);
        context.restore();
    }

    erase(context, imageData){
        context.putImageData(imageData, 0, 0);
    }
}