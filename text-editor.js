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
        context.rect(this.left, this.top, this.width, this.getHeight(context));
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
        context.putImageData(imageData, 0, 0, this.left, this.top, this.width + 1, this.getHeight(context));
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
        let first = this.text.slice(0, this.caret);
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

        context.strokeText(this.text, this.left, this.bottom);
        context.fillText(this.text, this.left, this.bottom);
        context.restore();
    }

    erase(context, imageData){
        context.putImageData(imageData, 0, 0);
    }
}

class Paragraph {
    constructor(context, left, top, imageData, cursor) {
        this.context = context;
        this.drawingSurface = imageData;
        this.left = left;
        this.top = top;
        this.lines = [];
        this.activeLine = undefined;
        this.cursor = cursor;
        this.blinkingInterval = undefined;
    }
    
    isPointInside(loc){
        const context = this.context;
        context.beginPath();
        context.rect(this.left,this.top, this.getWidth(), this.getHeight());
        return context.isPointInPath(loc.x, loc.y);
    }

    getHeight(){
        let h = 0;
        this.lines.forEach((line) => {
            h += line.getHeight(this.context);
        })
        return h;
    }

    getWidth(){
        let widest = 0;

        this.lines.forEach((line) => {
            const w = line.getWidth(this.context); 
            if (w > widest) {
                widest = w;
            }
        });
        return widest;
    }

    draw(){
        this.lines.forEach(line => line.draw(this.context));
    }

    erase(context, imageData){
        context.putImageData(imageData, 0, 0);
    }

    addLine(line){
        this.lines.push(line);
        this.activeLine = line;
        this.moveCursor(line.left, line.bottom);
    }

    insert(text){
        this.erase(this.context, this.drawingSurface);
        this.activeLine.insert(text);

        const t = this.activeLine.text.substring(0, this.activeLine.caret);
        const w = this.context.measureText(t).width;

        this.moveCursor(this.activeLine.left + w, this.activeLine.bottom);
        this.draw();
    }

    blinkCursor(){
        const BLINK_OUT = 200;
        const BLINK_INTERVAL = 900;
        
        this.blinkingInterval = setInterval(() => {
            this.cursor.erase(this.context, this.drawingSurface);

            setTimeout(() => {
                this.cursor.draw(this.context, this.cursor.left, this.cursor.top + this.cursor.getHeight(this.context));
            }, BLINK_OUT);
        }, BLINK_INTERVAL)
    }

    clearCursor(){
        clearInterval(this.blinkingInterval);
        this.cursor.erase(this.context, this.drawingSurface);
    }

    moveCursorCloseTo(x, y){
        const line = this.getLine(y);
        if(line){
            line.caret = this.getColumn(line, x);
            this.activeLine = line;
            this.moveCursor(line.getCaretX(context), line.bottom);
        }
    }

    getLine(y){
        for(let i = 0; i < this.lines.length; i++){
            const line = this.lines[i];
            if(line.bottom > y && (line.bottom - line.getHeight(this.context)) < y) {
                return line;
            }
        }
    }

    getColumn(line, x){
        let found = false;
        let before,
            after,
            closest,
            tmpLine,
            column;
        
        tmpLine = new TextLine(line.left, line.bottom);
        tmpLine.insert(line.text);
        while(!found && tmpLine.text.length > 0){
            before = tmpLine.left + tmpLine.getWidth(this.context);
            tmpLine.removeLastCharacter();
            after = tmpLine.left + tmpLine.getWidth(this.context);

            if(after < x){
                closest = x - after < before - x ? after : before;
                column = closest === before ?
                         tmpLine.text.length + 1 : tmpLine.text.length;
                found = true;
            }
        }

        return column;
    }

    moveCursor(x, y){
        this.cursor.erase(this.context, this.drawingSurface);
        this.cursor.draw(this.context, x, y);
        if(!this.blinkingInterval) this.blinkCursor();
    }

    moveLinesDown(start){
        for(let i = start ;i<this.lines.length; i++){
            const line = this.lines[i];
            line.bottom += line.getHeight(this.context);
        }
    }

    newLine(){
        const textBeforeCursor = this.activeLine.text.substring(0, this.activeLine.caret);
        const textAfterCursor = this.activeLine.text.substring(this.activeLine.caret);
        const height = this.context.measureText('W').width +
                   this.context.measureText('W').width/6;
        const bottom  = this.activeLine.bottom + height;

        let activeIndex, line;

        this.erase(this.context, this.drawingSurface);
        this.activeLine.text = textBeforeCursor;

        line = new TextLine(this.activeLine.left, bottom);
        line.insert(textAfterCursor);

        activeIndex = this.lines.indexOf(this.activeLine);
        this.lines.splice(activeIndex + 1, 0, line);

        this.activeLine = line;
        this.activeLine.caret = 0;

        activeIndex += 1;
        this.moveLinesDown(activeIndex + 1);
        
        this.draw();
        this.cursor.draw(this.context, this.activeLine.left, this.activeLine.bottom);
    }
  
    activeLineIsTopLine(){
        return this.lines[0] === this.activeLine;
    }

    moveUpOneLine(){
        const lastActiveLine = this.activeLine;
        const lastActiveText = '' + lastActiveLine.text;

        const activeIndex = this.lines.indexOf(this.activeLine);
        this.activeLine = this.lines[activeIndex - 1];
        this.activeLine.caret = this.activeLine.text.length;

        this.lines.splice(activeIndex, 1);

        this.moveCursor(
            this.activeLine.left + this.activeLine.getWidth(this.context),
            this.activeLine.bottom
        );

        this.activeLine.text += lastActiveText;

        for (let i=activeIndex; i < this.lines.length; ++i) {
            const line = this.lines[i];
            line.bottom -= line.getHeight(this.context);
         }
    }

    backspace(){
        this.context.save();

        if(this.activeLine.caret === 0){
            if(!this.activeLineIsTopLine()){
                this.erase(this.context, this.drawingSurface);
                this.moveUpOneLine();
                this.draw();
            }
        }else{  // active line has text
            this.erase(this.context, this.drawingSurface);
            this.activeLine.removeCharacterBeforeCaret();
            const t = this.activeLine.text.slice(0, this.activeLine.caret);
            const w = this.context.measureText(t).width;

            this.moveCursor(this.activeLine.left + w, this.activeLine.bottom);

            this.draw();
        }

        this.context.restore();
    }
}