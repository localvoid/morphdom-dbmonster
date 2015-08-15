'use strict';

var morphdom = require('morphdom');
var I = 0;
var N = 100;

function Query(elapsed, waiting, query) {
  this.elapsed = elapsed;
  this.waiting = waiting;
  this.query = query;
}

Query.rand = function() {
  var elapsed = Math.random() * 15;
  var waiting = Math.random() < 0.5;
  var query = 'SELECT blah FROM something';

  if (Math.random() < 0.2) {
    query = '<IDLE> in transaction';
  }

  if (Math.random() < 0.1) {
    query = 'vacuum';
  }

  return new Query(elapsed, waiting, query);
};

var _nextId = 0;
function Database(name) {
  this.id = _nextId++;
  this.name = name;
  this.queries = null;

  this.update();
}

Database.prototype.update = function() {
  var queries = [];

  var r = Math.floor((Math.random() * 10) + 1);
  for (var j = 0; j < r; j++) {
    queries.push(Query.rand());
  }

  this.queries = queries;
};

Database.prototype.getTopFiveQueries = function() {
  var qs = this.queries.slice();
  qs.sort(function(a, b) {
    return a.elapsed - b.elapsed;
  });
  qs = qs.slice(0, 5);
  while (qs.length < 5) {
    qs.push(new Query(0.0, false, ''));
  }
  return qs;
};

function formatElapsed(v) {
  if (!v) return '';

  var str = parseFloat(v).toFixed(2);

  if (v > 60) {
    var minutes = Math.floor(v / 60);
    var comps = (v % 60).toFixed(2).split('.');
    var seconds = comps[0];
    var ms = comps[1];
    str = minutes + ":" + seconds + "." + ms;
  }

  return str;
}

function labelClass(count) {
  if (count >= 20) {
    return 'label label-important';
  } else if (count >= 10) {
    return 'label label-warning';
  }
  return 'label label-success';
}

function elapsedClass(t) {
  if (t >= 10.0) {
    return 'Query elapsed warn_long';
  } else if (t >= 1.0) {
    return 'Query elapsed warn';
  }
  return 'Query elapsed short';
}

function render(dbs) {
  var table = document.createElement('table');
  table.className = 'table table-striped table-latest-data';

  var tbody = document.createElement('tbody');
  table.appendChild(tbody);

  for (var i = 0; i < dbs.length; i++) {
    var db = dbs[i];
    var topFiveQueries = db.getTopFiveQueries();
    var count = db.queries.length;

    var row = document.createElement('tr');
    row.id = 'row_' + db.id;
    tbody.appendChild(row);

    var nameCol = document.createElement('td');
    nameCol.className = 'dbname';
    nameCol.textContent = db.name;
    row.appendChild(nameCol);

    var countCol = document.createElement('td');
    countCol.className = 'query-count';
    row.appendChild(countCol);

    var countColSpan = document.createElement('span');
    countColSpan.className = labelClass(count);
    countColSpan.textContent = count;
    countCol.appendChild(countColSpan);

    for (var j = 0; j < 5; j++) {
      var q = topFiveQueries[j];
      var elapsed = q.elapsed;

      var col = document.createElement('td');
      col.className = elapsedClass(elapsed);
      row.appendChild(col);

      var txt = document.createTextNode(formatElapsed(elapsed));
      col.appendChild(txt);

      var popover = document.createElement('div');
      popover.className = 'popover left';
      col.appendChild(popover);

      var popoverContent = document.createElement('div');
      popoverContent.className = 'popover-content';
      popover.appendChild(popoverContent);

      var popoverTxt = document.createTextNode(q.query);
      popoverContent.appendChild(popoverTxt);

      var popoverArrow = document.createElement('div');
      popoverArrow.className = 'arrow';
      popover.appendChild(popoverArrow);
    }
  }

  return table;
}

document.addEventListener('DOMContentLoaded', function() {
  var dbs = [];
  for (var i = 0; i < N; i++) {
    dbs.push(new Database('cluster' + i));
    dbs.push(new Database('cluster' + i + 'slave'));
  }

  var container = document.getElementById('app');
  var root = render(dbs);
  container.appendChild(root);

  function update() {
    for (var i = 0; i < dbs.length; i++) {
      dbs[i].update();
    }
    morphdom(root, render(dbs));
    Monitoring.renderRate.ping();
    setTimeout(update, I);
  }
  update();
});
