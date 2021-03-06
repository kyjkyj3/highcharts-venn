(function (Highcharts){

  'use strict';
  var defaultOptions = Highcharts.getOptions(),
  defaultPlotOptions = defaultOptions.plotOptions,
  seriesTypes = Highcharts.seriesTypes,
  merge = Highcharts.merge,
  noop = function () {},
  each = Highcharts.each;

  defaultPlotOptions.venn = merge(defaultPlotOptions.pie, {
    borderWidth: 0
  });



  seriesTypes.venn = Highcharts.extendClass(Highcharts.Series, {
    type: 'venn',
    isCartesian: false,
    pointClass: Highcharts.seriesTypes.pie.prototype.pointClass,
    trackerGroups: ['group'],
    animate: noop,
    getSymbol: noop,
    getCenter: noop,
    drawGraph: noop,
    getColor: noop,
    drawTracker: seriesTypes.column.prototype.drawTracker,
    drawLegendSymbol: seriesTypes.pie.prototype.drawLegendSymbol,
    setData: seriesTypes.pie.prototype.setData,

    cA: {x: null, y: null},
    cB: {x: null, y: null},
    cC: {x: null, y: null},


    init: function(chart, options) {
      Highcharts.Series.prototype.init.apply(this, arguments);
    },

    setTooltipPoints: noop,

    /*Here we have to calculate all shapes and append them to this.data*/
    translate: function(){
      /*We sort  intersections and Circles*/
      this.data=this.sortCircle(this.data);


      /*We get the the width and height of container*/
      var chart = this.chart,
      plotWidth = chart.plotWidth,
      plotHeight = chart.plotHeight,


      /*We set the amounts of circles and intersections*/
      followA = this.data[0].y,
      followB = this.data[1].y,
      followC = this.data[2].y,
      followAB = this.data[3].y,
      followBC = this.data[4].y,
      followAC = this.data[5].y;


      /*We create scale of diagrams*/
      var percentageSize=this.sizeContainer(plotWidth, plotHeight);
      var scale = this.createScale(percentageSize);


      /*We set the size of intersections and circles*/
      var sizeCircle=0.10;
      var rA = this.rA = scale(followA/followA/sizeCircle);
      var rB = this.rB = scale(followB/followA/sizeCircle);
      var rC = this.rC = scale(followC /followA/sizeCircle);
      var ab = this.ab = scale(followAB/followA/sizeCircle);
      var cb = this.cb = scale(followBC/followA/sizeCircle);
      var ac = this.ac = scale(followAC/followA/sizeCircle);
      this.positionCA(plotWidth, plotHeight);

      /*We set a minimum size*/
      this.minSize();

      /*with this variables we manage the behaviour of intersections*/
      var ejeAB=this.ejeAB=0;
      var ejeBC=this.ejeBC=0;
      var ejeAC=this.ejeAC=0;
      this.ACInterceptionBehaviour=0;
      this.BCInterceptionBehaviour=0;

      /*radius of circles to calculate the position of  third circle*/
      this.rAC = 0;
      this.rCB = 0;

      /*the position of second intersection*/
      this.cB = {x: this.cA.x+this.rA+this.rB-2*ab, y: this.cA.y};

      /*We calculate the positions of c, the intersections and behaviour of intersections*/
      this.calculateC();
      this.calculateIntersections();
      this.lineInterBC();
      this.lineInterAC();
      this.lineInterAB();

      /*We set the properties of figures*/
      this.data[0].shapeType = 'circle';
      this.data[0].shapeArgs = {
        x: this.cA.x,
        y: this.cA.y,
        r: this.rA,
        id:'BigCircle',

        fill: this.data[0].color,
        opacity: 0.5
      };
      this.data[1].shapeType = 'circle'
      this.data[1].shapeArgs = {
        x: this.cB.x,
        y: this.cB.y,
        id:'MidCircle',
        r: this.rB,
        fill: this.data[1].color,
        opacity: 0.5
      };
      this.data[2].shapeType = 'circle';
      this.data[2].shapeArgs = {
        x: this.cC.x,
        y: this.cC.y,
        id:'LitCircle',

        r: this.rC,
        fill: this.data[2].color,
        opacity: 0.5
      };

      this.data[3].shapeType = 'path';
      this.data[3].shapeArgs = {
        d:  ['M', this.ABinter.x0, this.ABinter.y0, 'A', this.rB, this.rB ,0, this.ejeAB, 0, this.ABinter.x1, this.ABinter.y1, 'M', this.ABinter.x0, this.ABinter.y0, 'A', this.rA, this.rA, 0, 0, 1, this.ABinter.x1, this.ABinter.y1 ],
        stroke:'violet',
        fill: 'transparent'
      };

      this.data[5].shapeType = 'path',
      this.data[5].shapeArgs = {
        d:  ['M',this.ACinter.x0, this.ACinter.y0,'A',this.rC,this.rC,0,this.ejeAC,0,this.ACinter.x1,this.ACinter.y1,'M',this.ACinter.x0, this.ACinter.y0,'A',this.rA,this.rA,0,0,1,this.ACinter.x1,this.ACinter.y1 ],
        stroke:'black',
        fill: 'transparent'
      }

      this.data[4].shapeType = 'path';
      this.data[4].shapeArgs = {
        d:  ['M', this.BCinter.x0, this.BCinter.y0,'A', this.rC, this.rC, 0, this.ejeBC, 0, this.BCinter.x1,this.BCinter.y1,'M',this.BCinter.x0, this.BCinter.y0,'A',this.rB,this.rB,0,0,1,this.BCinter.x1,this.BCinter.y1 ],
        stroke:'black',
        fill: 'transparent'
      }

    },

    /*we set the minimum size of second and third circle*/
    minSize: function(){
      if(this.rB<(this.rA*0.12) && this.rB>this.rC){

        this.rB=(this.rA*0.12);
        if(this.data[2].y>0)
          this.rC=(this.rA*0.08);

      }else{

        if(this.rB<(this.rA*0.12) && this.rB==this.rC && this.data[2].y>0){
          this.rB=(this.rA*0.12);
          this.rC=(this.rA*0.12);

        }else{

          if( this.rC<(this.rA*0.12) && this.data[2].y>0){
            this.rC=(this.rA*0.12);
          }
        }
      }
    },

    /*Sort amounts and intersections*/
    sortCircle:function(array){
      var circles = array.slice(0,3);
      var intersections = array.slice(3);
      var aux;
      var indexedCircles = [
      /*circle a*/
      {key: 0, value: circles[0]},
      /*circle b*/
      {key: 1, value: circles[1]},
      /*circle c*/
      {key: 2, value: circles[2]}
      ];
      var indexedIntersecs = {
        /*isec ab 0+1*/
        1: intersections[0],
        /*isec bc 1+2*/
        3: intersections[1],
        /*isec ac 0+2*/
        2: intersections[2]
      };

      /*Sort circles normally with the bubble algorithm*/
      for(var i=0; i<indexedCircles.length; i++){
        for(var j=0; j<indexedCircles.length; j++){
          if(indexedCircles[j].value.y<indexedCircles[i].value.y){
            aux = indexedCircles[i];
            indexedCircles[i] = indexedCircles[j];
            indexedCircles[j] = aux;
          }
        }
      }

      /*
        Now sort the intersections based on the new circle indexes
        if we have a initial array like this
        [
        (a) circle 0 with value 3
        (b) circle 1 with value 2
        (c) circle 2 with value 1
        ]
        indexedCircles now we have:
        [
        (a) circle 2 with value 1
        (b) circle 1 with value 2
        (c) circle 0 with value 3
        ]
        In order to regenarate de intersections, we have to sum the circle keys and get it from the indexedIntersections:
        [
        (ab) circle 2+circle 1 = intersection 3,
        (bc) circle 1+circle 0 = intersection 1,
        (ac) circle 2+circle 0 = intersection 2
        ]
        */
        var orderedIntersections = [
        indexedIntersecs[indexedCircles[0].key+indexedCircles[1].key],
        indexedIntersecs[indexedCircles[1].key+indexedCircles[2].key],
        indexedIntersecs[indexedCircles[0].key+indexedCircles[2].key],
        ];

        return indexedCircles
          .map(function(item){return item.value})
          .concat(orderedIntersections);
      },


      /*the position of third circle*/
      calculateC: function(){
        var rAC = this.rAC,
        rC = this.rC,
        rA = this.rA,
        ac = this.ac,
        rCB = this.rCB,
        rB = this.rB,
        cb = this.cb,
        cA = this.cA,
        cB = this.cB;

        if(this.rC!=null){
          this.rAC = this.rA+this.rC-this.ac*2;
          this.rCB = this.rB+this.rC-this.cb*2;
          var intsec = this.intersection(this.cA.x, this.cA.y, this.rAC, this.cB.x, this.cB.y, this.rCB);


          if(isNaN(intsec[1])){
            intsec[3]=this.cA.y;
            intsec[1]=this.cA.x;
          }

          /*left interception AC*/
          if(intsec[3]==this.cA.y && intsec[1]==this.cA.x && ac!=this.rC && this.cb==0){
            intsec[1]=this.cA.x-this.rA-this.rC+2*this.ac;
            this.ACInterceptionBehaviour=1;
          }

          /*right interception CB*/
          if(intsec[3]==this.cA.y && intsec[1]==this.cA.x && this.ac!=this.rC &&  this.ac==0){
            intsec[1]=this.cB.x+this.rB+this.rC-2*this.cb;
            this.BCInterceptionBehaviour=1;
          }

          /*in the middle of B and A*/
          if(intsec[3]==this.cA.y && intsec[1]==this.cA.x && this.ac!=this.rC ){
            intsec[3]=this.cA.y;
            intsec[1]=this.cA.x+this.rA+this.cb-this.ac;
            this.ACInterceptionBehaviour=2;
            this.BCInterceptionBehaviour=2;
          }

          this.cC = {x: intsec[1], y: intsec[3]};

        }
      },

      /*We dont use this functions, in the future I will develop the last interception*/
      interABC: function(){
        var flag=true;
        var distancia=Math.sqrt(Math.pow(this.cC.x-this.ABinter.x0,2)+Math.pow(this.cC.y-this.ABinter.y0,2));
        if(distancia>this.rC){
          flag=false;
        }
        return flag;
      },

      calculateIntersections: function(){
        var rAC = this.rAC,
        rC = this.rC,
        rA = this.rA,
        ac = this.ac,
        rCB = this.rCB,
        rB = this.rB,
        cb = this.cb,
        ab = this.ab,
        cA = this.cA,
        cB = this.cB,
        cC = this.cC;
        var intsec;
        if(ab!=null){
          /*INTERSECTION OF A CIRCLE AND B CIRCLE*/
          intsec=this.intersection(cA.x, cA.y, rA, cB.x, cB.y, rB);
          this.ABinter={x0: intsec[1], y0: intsec[3], x1: intsec[0], y1: intsec[2]};
        }

        if(ac!=null){
          /*INTERSECTION OF A CIRCLE AND C CIRCLE*/
          intsec=this.intersection(cA.x, cA.y, rA, cC.x, cC.y, rC);
          this.ACinter={x0: intsec[1], y0: intsec[3], x1: intsec[0], y1: intsec[2]};
        }

        if(cb!=null){
          /*INTERSECTION OF B CIRCLE AND C CIRCLE*/
          intsec=this.intersection(cB.x, cB.y, rB, cC.x, cC.y, rC);
          this.BCinter={x0: intsec[1], y0: intsec[3], x1: intsec[0], y1: intsec[2]};
        }

        if((ac!=null && cb!=null && ab!=null) && this.interABC() && !(this.cC.y-rC<this.ABinter.y0 && this.cC.y+this.rC>this.ABinter.y1)){
          /*INTERSECTION ABC,  We dont use this code, in the future I will develop the last interception*/
          this.ABCinter={x0:this.ABinter.x0, y0:this.ABinter.y0, x1:this.ACinter.x1, y1:this.ACinter.y1, x2:this.BCinter.x0, y2:this.BCinter.y0};



          this.pathStringABC=[ 'M', this.ABCinter.x0, this.ABCinter.y0, 'A', this.rA, this.rA ,0, 0, 1, this.ABCinter.x1, 	this.ABCinter.y1, 'M',
          this.ABCinter.x1, this.ABCinter.y1, 'A', this.rC, this.rC, 0, 0, 1, this.ABCinter.x2, this.ABCinter.y2, 'M',
          this.ABCinter.x2, this.ABCinter.y2, 'A', this.rB, this.rB, 0, 0, 1, this.ABCinter.x0, this.ABCinter.y0,
          'M', this.ABCinter.x0, this.ABCinter.y0, 'L', this.ABCinter.x1, this.ABCinter.y1, 'L',
          this.ABCinter.x2, this.ABCinter.y2, 'z' ];
        }else{
          this.ABCinter={x0:0, y0:0, x1:0, y1:0, x2:0, y2:0};

          if( (ac!=null && cb!=null && ab!=null) && (this.cC.y-this.rC)>this.ABinter.y0){

            this.pathStringABC=[ 'M', this.BCinter.x1, this.BCinter.y1, 'A', this.rC, this.rC ,0, 0, 1, this.ACinter.x0, 	this.ACinter.y0, 'M',
            this.ACinter.x0, this.ACinter.y0, 'A', this.rA, this.rA, 0, 0, 1, this.ACinter.x1, this.ACinter.y1, 'M', this.ACinter.x1, this.ACinter.y1,
            'A', this.rC, this.rC, 0, 0, 1, this.BCinter.x0, this.BCinter.y0 , 'M',  this.BCinter.x0, this.BCinter.y0, 'A', this.rB, this.rB ,0, 0, 1, this.BCinter.x1, this.BCinter.y1
            ,'M', this.BCinter.x1, this.BCinter.y1, 'L',  this.ACinter.x0, 	this.ACinter.y0  , 'L',  this.ACinter.x1, 	this.ACinter.y1
            , 'L',  this.BCinter.x0, 	this.BCinter.y0,  'L',  this.BCinter.x1, 	this.BCinter.y1, 'z' ];
          }

          if(this.cC.y-rC<this.ABinter.y0 && this.cC.y+this.rC>this.ABinter.y1){
            this.pathStringABC=['M', this.ABinter.x0, this.ABinter.y0, 'A', this.rB, this.rB ,0, 0, 0, this.ABinter.x1, this.ABinter.y1, 'M', this.ABinter.x0, this.ABinter.y0, 'A', this.rA, this.rA, 0, 0, 1, this.ABinter.x1, this.ABinter.y1 ];
          }
        }
      },

      /*Draw the points defined in translate method*/
      drawPoints: function(){
        var renderer = this.chart.renderer;
        var series = this;
        each(this.data, function (point,i) {
          var graphic = point.graphic,
          shapeArgs = point.shapeArgs,
          shapeType=point.shapeType;
          if(graphic){
            graphic.attr({
              /*Since the marker group isn't clipped, each individual
                marker must be toggled visibility:
                point.visible===false? 'hidden' : 'visible' */
            })
          }else{

            if(shapeType=='path'){

              point.graphic = renderer.path(shapeArgs).add(series.group);
            }else{
              point.graphic = renderer.circle(shapeArgs).add(series.group);

            }
          }
        });
      },

      sizeContainer: function(width, height){
        return height;
      },

      /*THE POSITION OF FIRST CIRCLE*/
      positionCA: function(width, height){
        var yFactor;
        var distancia;
        var positionCAx;
        if(this.data[2].y==0){
          yFactor = 0.40;
        }else{
          yFactor = 0.48;
        }
        distancia=((this.rA)*2+(this.rB)*2)-(this.ab);

        positionCAx=((width)/2-(distancia)/2)+this.rA;

        this.cA.x=(positionCAx);
        this.cA.y=(height*yFactor);
      } ,

      /*scale of circles*/
      createScale: function(max){
        var maxArea = Math.pow(max,2)*Math.PI;
        return function scale(n){

          if(n>100)
            n=100;

          return Math.sqrt(((n*maxArea)/100)/Math.PI);
        }
      },

      /*THE INTERCEPTION OF A CIRCLE AND C CIRCLE*/
      lineInterAC: function(){
        /*el punto que se encuentra en mitad de la interseccion*/
        var puntoInterAC={x:this.ACinter.x0, y:this.ACinter.y0};

        var distancia=Math.sqrt(Math.pow(this.ACinter.x0-this.ACinter.x1,2)+Math.pow(this.ACinter.y0-this.ACinter.y1,2));
        var pendiente=(this.ACinter.y1-this.ACinter.y0)/(this.ACinter.x1-this.ACinter.x0);
        var intercepto=this.ACinter.y0-(pendiente*this.ACinter.x0);

        /*la mitad de la linea de intercepcion*/
        var mitad=(this.ACinter.x1-this.ACinter.x0)/2;

        puntoInterAC.x=this.ACinter.x0+mitad;
        puntoInterAC.y=(pendiente)*(puntoInterAC.x)+intercepto;

        switch(this.ACInterceptionBehaviour)
        {
          case 1:
            if(this.ACinter.x0>this.cC.x){
              this.ejeAC=0;
            }else{

              this.ejeAC=1;
            }
            /*left intersection*/
          break;

          case 2:
            if(this.ACinter.x0<this.cC.x){
              this.ejeAC=0;
            }else{
              this.ejeAC=1;
            }
            /*right intersection*/
          break;


          default:
            if(puntoInterAC.y<this.cC.y){
              this.ejeAC=1;
            }else{
              this.ejeAC=0;
            }
            /*normal behaviour*/
        }
      },


      /*THE INTERSECTION OF A CIRCLE AND B CIRCLE*/
      lineInterAB: function(){

        if(this.ABinter.x0>this.cB.x){
          this.ejeAB=1;

        }else{
          this.ejeAB=0;
        }
      },

      /*THE INTERSECTION OF B CIRCLE AND C CIRCLE*/
      lineInterBC: function(){
        var puntoInterBC={x:this.BCinter.x0, y:this.BCinter.y0};

        var pendiente=(this.BCinter.y1-this.BCinter.y0)/(this.BCinter.x1-this.BCinter.x0);
        var intercepto=this.BCinter.y0-(pendiente*this.BCinter.x0);

        /*la mitad de la linea de intercepcion*/
        var mitad=(this.BCinter.x1-this.BCinter.x0)/2;

        puntoInterBC.x=this.BCinter.x0+mitad;
        puntoInterBC.y=(pendiente)*(puntoInterBC.x)+intercepto;

        switch(this.BCInterceptionBehaviour)
        {
          case 1:
            if(this.BCinter.x0>this.cC.x){
              this.ejeBC=1;
            }else{

              this.ejeBC=0;
            }
            /*right intersection*/
          break;

          case 2:
            if(this.BCinter.x0<this.cC.x){

              this.ejeBC=1;
            }else{

              this.ejeBC=0;
            }
            /*left intersection*/
          break;

          default:

            if(puntoInterBC.y<this.cC.y){
              this.ejeBC=1;
            }else{

              this.ejeBC=0;
            }
          }
          /*normal behaviour*/
      },

      /*THE INTERSECTION OF TWO CIRCLES*/
      intersection: function(x0, y0, r0, x1, y1, r1) {
        var a, dx, dy, d, h, rx, ry;
        var x2, y2, i=0;

        /* dx and dy are the vertical and horizontal distances between the circle centers. */
        dx = x1 - x0;
        dy = y1 - y0;

        /* Determine the straight-line distance between the centers. */
        d = Math.sqrt((dy*dy) + (dx*dx));
        while(i<0){

          /* Check for solvability. */
          if (!( d > (r0 + r1) || d < Math.abs(r0-r1))) {
            /* no solution. circles do not intersect. */
            /* no solution. one circle is contained in the other */
            break;
          }
          d++;

          i++;
        }
        if(i===5) return false;

        /* 'point 2' is the point where the line through the circle
        * intersection points crosses the line between the circle
        * centers.
        */

        /* Determine the distance from point 0 to point 2. */
        a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

        /* Determine the coordinates of point 2. */
        x2 = x0 + (dx * a/d);
        y2 = y0 + (dy * a/d);

        /* Determine the distance from point 2 to either of the
         * intersection points.
         */
         h = Math.sqrt((r0*r0) - (a*a));

         /* Now determine the offsets of the intersection points from point 2. */
         rx = -dy * (h/d);
         ry = dx * (h/d);

         /* Determine the absolute intersection points. */
         var xi = x2 + rx;
         var xi_prime = x2 - rx;
         var yi = y2 + ry;
         var yi_prime = y2 - ry;

         return [xi, xi_prime, yi, yi_prime];
      }
    }
  );
}(Highcharts));
