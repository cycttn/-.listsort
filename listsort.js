/**
The MIT License (MIT)
Copyright (c) <2014> <lovelotte.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */;


/**
 * Sorting for lists;
 * 
 * @param {type} $
 * @returns {undefined}
 */
(function($){
    var data_key = "listSort-obj";

    var defaults = {
        'list-wrapper': 'table',
        'list-header': 'thead th',
        'list-els': 'tbody tr',
        'list-param': 'td',
        'sort-cols': [],
        'sort-col': 0,
        'sort-dir': 0,
        'classes': {
            'asc': 'asc', 'desc':'desc'
        },
        'getValue': getValue
    };

    /**
     * ListSort class initialization
     * @param {type} options
     * @param {type} dom
     * @returns {undefined}
     */
    $.listSort = function(options, dom){
        this.options = $.extend({}, defaults, options);
        this.$this = $(dom); 
        this.$this.trigger('listsort::preinit', this.options);
        
        this.$wrap = this.$this.find( this.options['list-wrapper'] );
        
        if( this.$wrap.size() == 0 ){
            this.$head = this.$this.find( this.options['list-header'] );
            this.$els = this.$this.find( this.options['list-els'] );
        }else{
            this.$head = this.$wrap.find( this.options['list-header'] );
            this.$els = this.$wrap.find( this.options['list-els'] );
        }
       
        this.currSort = -1; //this.options['sort-col']; 
        this.sortDir = this.options['sort-dir']; //1 = asc; , -1 is desc; 0 is unsorted; 
        
        this.sorted = {}; 
        
        //Determine columns to be sorted!
        this.sortCols = {}; 
        if( this.options['sort-cols'].length == 0 ){
            for(var i=0; i<this.$head.length; i++){
                this.sortCols[i] = this.$head.eq(i).text(); //headers!
            }
        }else{
            //Go through what's in sort-cols
            for(var i in this.options['sort-cols']){
                var val = this.options['sort-cols'][i];
                if( $.isNumeric(val) ){ //If numeric; parse the number and set the sortCols entry
                    val = parseInt(val);
                    this.sortCols[val] = this.$head.eq(val).text();
                }else{ //if not numeric, then define Sort Cols
                    for( var j = 0; j < this.$head.length; j++ ){
                        if( val.toLowerCase() == this.$head.eq(j).text().toLowerCase() ){
                            this.sortCols[j] = this.$head.eq(j).text(); 
                            break;
                        }
                    }
                }
            }
        }
        
        //Initialize selectors for onclick of headers
        var __this = this; 
        for(var i in this.sortCols ){
            this.$head.eq(i).addClass('sortable').click({index:i}, function(e){
                __this.sort( e.data.index );
            });
        }
        
        //If has inputs or contentEditable!
        var editable = this.$wrap.find('input, textarea, checkbox, div[contenteditable=\'true\']');
        if( editable.size() != 0 ){
            editable.filter('input, textarea, checkbox').change(function(){
                __this.sorted = {}; 
            });
            
            editable.filter('div').keyup(function(){
                __this.sorted = {}; 
            });
        }
        
        
        this.$this.trigger('listsort::init', this);
        
        if( this.sortDir != 0 ) this.sort(this.options['sort-col'], this.sortDir); //trigger sort!
    };
    
    /**
     * Sort on column i
     * @param {type} i
     */
    $.listSort.prototype.sort = function(i, s){
        this.$this.trigger('listsort::sorting', this);
        
        if( this.currSort == i){
            if( !s ){
                switch(this.sortDir){
                    case -1: case 0: this.sortDir++; break;
                    default: this.sortDir = -1; 
                }                
            }
        }else{
            this.$head.eq(this.currSort).removeClass('asc desc'); //Remove sort from other column
            this.currSort = i; 
            
            if( !s ) this.sortDir = 1; //ASC
            else this.sortDir = s; 
        }

        switch(this.sortDir){
            case 0: this.toOriginal(i);  break;
            case 1: this.asc(i); break;
            case -1: this.desc(i); 
        }
        
        this.$this.trigger('listsort::sorted', this, i);        
    };
    
    /**
     * To be called when a row should be added
     * @param {dom object} $el - element that has been added
     */
    $.listSort.prototype.add = function($el){
        this.$els.add( $el );
        this.sorted = {}; 
    };
    
    /**
     * To be called when a row should be removed
     * @param {dom object} $el - element that has been added
     */
    $.listSort.prototype.delete = function($el){
        var i = this.$els.index( $el );
        this.$els = this.$els.not($el);
        this.sorted = {};         
    };
    
    $.listSort.prototype.toOriginal = function(i){
        this.$head.eq(i).removeClass(this.options.classes.asc + ' ' + this.options.classes.desc);
        //this.$els contains original array; 
        
        var $wrap = ( this.$wrap.size() > 0 )? this.$wrap : this.$this; 
        for(var i=0; i<this.$els.length; i++){
            $wrap.append(this.$els.eq(i));
        }                
    };
    
    $.listSort.prototype.asc = function(i){
        this.$head.eq(i).removeClass(this.options.classes.desc).addClass(this.options.classes.asc);
        
        var sorted = this.getSortedElements(i); //get sorted elements
        
        var $wrap = ( this.$wrap.size() > 0 )? this.$wrap : this.$this; 
        for(var i=0; i<sorted.length; i++){
            $wrap.append(this.$els.eq(sorted[i]));
        }        
    };
    
    $.listSort.prototype.desc = function(i){
        this.$head.eq(i).removeClass(this.options.classes.asc).addClass(this.options.classes.desc);
        
        var sorted = this.getSortedElements(i); //get sorted elements
        
        var $wrap = ( this.$wrap.size() > 0 )? this.$wrap : this.$this; 
        for(var i=sorted.length-1; i >= 0; i--){
            $wrap.append(this.$els.eq(sorted[i]));            
        }
        //Populate
    };
    
    $.listSort.prototype.getSortedElements = function(i){
        if( i in this.sorted ) return this.sorted[i];
        else{
            var obj = {}; 
            
            for(var j=0; j<this.$els.size();j++ ){
                obj[j] = this.options.getValue.call( this.$els.eq(j), this.options['list-param'], i );
            }
            
            var sorted = sortObject(obj);
            this.sorted[i] = sorted; 
            return sorted;
        }
    };
    
    $.listSort.prototype.$get = function(){ return this.$this; };
    

    $.fn.listSort = function(options){
        if( $(this).length == 1){
            var l = $(this).data(data_key); 
            if( l instanceof $.listSort ) return l; 
            
            l = new $.listSort(options, this);
            $(this).data(data_key, l); 
            return l; 
        }else{
            var arr = [];
            $(this).each(function(){ arr.push( $(this).listSort(options, this)); });
            return arr;
        }
    };
    
    function getValue(sel, i){   
        var $obj = null;
        if( sel && $(this).children(sel).size() != 0){
            $obj = $(this).children(sel).eq(i);
        }else{
            $obj = $(this);
        }
        
        var inputs = $obj.find('input, textarea, checkbox');
        if( inputs.size() == 0 ) return $obj.text(); 
        else return inputs.eq(0).val(); //return the value of the first input!
    }
    
    /**
     * Sorts an object based on the key; Will automatically assume numeric
     * @param {object} obj to be sorted
     * @param {string} key to be used in the sort (optional)
     * @returns {Array} of keys (sorted)
     */
    function sortObject(obj, key){
        var arr = [], empty = []; 

        for(var i in obj ){
            var val = (key)? obj[i][key] : obj[i]; 
            if( $.type(val) == "string" && val.trim() == "" ){
                empty.push(i); //push index
                continue;
            }

            if( $.isNumeric(val) ){ //change to number if numeric
                val = parseInt(val); 
            }else if(Date && Date.parse){
                var dt = Date.parse(val);
                if( dt ) val = dt.getTime();
            }

            addToSortedArray(i, val);
        }

        //Change arr to only indices
        var arr2 = [];     
        for(var i=0; i<arr.length; i++){
            arr2.push( arr[i].index );
        }

        return empty.concat(arr2); 

        function addToSortedArray(index, value, st, en){
            var obj = {index:index, value:value}; 

            //Trivial Cases
            if( arr.length == 0 || arr[arr.length-1].value < value){
                arr.push(obj);
                return;
            }

            if( arr.length == 1 || arr[0].value >= value ){
                if( arr[0].value >= value ){ arr.unshift(obj); }
                else{ arr.push(obj); }
                return;
            }

            //Set defaults
            if( !st ) st = 0; 
            if( !en ) en = arr.length; 

            //Flip if st > en
            if( st > en ){
                var tmp = en;
                en = st; st = tmp;
            }

            switch(en-st){
                case 3: //add it to either st+1 or en position (making original en -> en+1)
                    if( arr[st+2].value < value ){
                        arr.splice(en, 0, obj);                    
                    }else if( arr[st+1].value > value ){
                        arr.splice(st+1, 0, obj);
                    }else{
                        arr.splice(st+2, 0, obj);
                    }                
                    return;
                case 2: 
                    if( arr[st+1].value > value ){
                        arr.splice(st+1, 0, obj); //add it in between                    
                    }else{
                        arr.splice(en, 0, obj);
                    }
                    return;
            }

            //Default Functionality
            var mid = Math.floor((en+st)/2);

            if( arr[mid].value > value ){
                addToSortedArray(index, value, st, mid);
            }else if( arr[mid].value == value ){
                arr.splice(mid, 0, obj);
            }else{
                addToSortedArray(index, value, mid, en);
            }

        }    
    };    
    
})(jQuery);


