
var DonutSlider = function(elementId, borderSize) {
  var _this = this,
      size = Math.min($('#' + elementId).width(), 
                      $('#' + elementId).height());
  this.pie = d3.layout.pie().sort(null);
  this.arc = d3.svg.arc()
             .innerRadius((size / 2) - borderSize)
             .outerRadius(size / 2);
  this.svg = d3.select('#' + elementId).append('svg')
             .attr('width', size)
             .attr('height', size)
             .append('g')
             .attr('transform', 'translate(' + size / 2 + ',' + size / 2 + ')');
  this.path = this.svg.selectAll('path')
              .data(this.pie([0, 100]))
              .enter().append('path')
                .attr('fill', function(d, i) { 
                   return _this.colors[i];
                })
                .attr('d', this.arc);

  this.dragdealer = new Dragdealer(elementId, {
    x: 1,
    slide: false,
    animationCallback: function(x, y) {
      _this.updateChart((1 - x) * 100);
      $('#' + elementId).find('.value').text(Math.round((1 - x) * 100));
    }
  });
};

DonutSlider.prototype = {
  colors: ['#ff6666', '#eee'],
  setValue: function(value) {
    this.dragdealer.setValue(1 - value, 0, true);
  },
  updateChart: function(value) {
    this.path.data(this.pie([value, 100 - value]))
             .attr('d', this.arc);      
  }
};
