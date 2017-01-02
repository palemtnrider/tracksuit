"use strict";
// initialize Hoodie
var hoodie  = new Hoodie();

// Todos Collection/View
function Todos($element) {
  var collection = [];
  var $el = $element;

  // Handle marking todo as "done"
  $el.on('click', 'input[type=checkbox]', function() {
    hoodie.store.remove('todo', $(this).parent().data('id'));
    return false;
  });

  // Handle "inline editing" of a todo.
  $el.on('click', 'label', function() {
    $(this).parent().parent().find('.editing').removeClass('editing');
    $(this).parent().addClass('editing');
    return false;
  });

  // Handle updating of an "inline edited" todo.
  $el.on('keypress', 'input[type=text]', function(event) {
    if (event.keyCode === 13) {
      hoodie.store.update('todo', $(this).parent().data('id'), {title: event.target.value});
    }
  });

  // Find index/position of a todo in collection.
  function getTodoItemIndexById(id) {
    for (var i = 0, len = collection.length; i < len; i++) {
      if (collection[i].id === id) {
        return i;
      }
    }
    return null;
  }

  function paint() {
    $el.html('');
    collection.sort(function(a, b) {
      return ( a.createdAt > b.createdAt ) ? 1 : -1;
    });
    for (var i = 0, len = collection.length; i<len; i++) {
      $el.append(
        '<li data-id="' + collection[i].id + '">' +
          '<input type="checkbox"> <label>' + collection[i].priority + ':' + collection[i].title + '</label>' +
          '<input type="text" value="' + collection[i].title + '"/>' +
         '</li>'
      );
    }
  }

  this.add = function(todo) {
    collection.push(todo);
    paint();
  };

  this.update = function(todo) {
    collection[getTodoItemIndexById(todo.id)] = todo;
    paint();
  };

  this.remove = function(todo) {
    collection.splice(getTodoItemIndexById(todo.id), 1);
    paint();
  };

  this.clear = function() {
    collection = [];
    paint();
  };
}

// Budget Collection/View
function Budgets($element) {
  var collection = [];
  var $el = $element;
  // Find index/position of a todo in collection.
  function getBudgetItemIndexById(id) {
    for (var i = 0, len = collection.length; i < len; i++) {
      if (collection[i].id === id) {
        return i;
      }
    }
    return null;
  }

  this.findBudgetById = function(id) {
     var idx = getBudgetItemIndexById(id);
     if (idx != null) {
        return collection[idx];
     }
     return null;
  }
  this.add = function(budget) {
     console.log("adding budget");
    collection.push(budget);
    paint();
  };

  this.update = function(budget) {
    collection[getBudgetItemIndexById(budget.id)] = budget;
    paint();
  };

  this.clear = function() {
    collection = [];
    paint();
  };
  function paint() {
    $el.html('');
    collection.sort(function(a, b) {
      return a.category.localeCompare(b.category );
    });
    for (var i = 0, len = collection.length; i<len; i++) {
      var consumedPct = (collection[i].amount - collection[i].remaining)/collection[i].amount * 100;
      $el.append(
        '<li data-id="' + collection[i].id + '">' +
          '<label>' + collection[i].category + '</label>'
          + '<div class="progress">'
          + '  <div class="progress-bar" role="progressbar" aria-valuenow="' + consumedPct + '" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em; width: ' + consumedPct + '%;">'
          + consumedPct + '% of ' + collection[i].amount
          + '  </div>'
          + '</div>'
          + '<button type="button" class="btn btn-primary btn-sm" data-toggle="modal" data-target="#txnModal" id="' + collection[i].id + '">'
          + '  Add Transaction'
          + '</button>'
        + '</li>'
      );
    }
  }
}


// Instantiate Todos collection & view.
var todos = new Todos($('#todolist'));

// Instantiate Todos collection & view.
var budgets = new Budgets($('#budgetlist'));

// initial load of all todo items from the store
hoodie.store.findAll('todo').then(function(allTodos) {
  allTodos.forEach(todos.add);
});

// initial load of all todo items from the store
hoodie.store.findAll('budget').then(function(allBudgets) {
  allBudgets.forEach(budgets.add);
});

// when a todo changes, update the UI.
hoodie.store.on('todo:add', todos.add);
hoodie.store.on('todo:update', todos.update);
hoodie.store.on('todo:remove', todos.remove);
// clear todos when user logs out,
hoodie.account.on('signout', todos.clear);

hoodie.account.on('signout', budgets.clear);


$('#txnModal').on('show.bs.modal', function(e) {
   $("#txn-budget-id").val(e.relatedTarget.id);
})
// handle creating a new task
$('#add-todo').on('click', function() {
  // ENTER & non-empty.
   hoodie.store.add('todo', {title: $("#todoinput").val(), priority: $("#priorityinput").val()});
   $("#todoinput").val('');
});

// handle creating a new budget category
hoodie.store.on('budget:add', budgets.add);
hoodie.store.on('budget:update', budgets.update);

function clear_budget_form() {
   $("#budget-amt").val('');
   $("#budget-cat").val('');
   $("#budget-month").val('');
   $("#budget-year").val('');
   $("#myModal").modal('toggle');

}
function clear_txn_form() {
   $("#txn-budget-id").val('');
   $("#txn-date").val('');
   $("#txn-payee").val('');
   $("#txn-amt").val('');
   $("#txn-note").val('');
   $("#txnModal").modal('toggle');

}

$('#add-category').on('click', function() {
  // ENTER & non-empty.
   hoodie.store.add('budget', {
      category: $("#budget-cat").val(),
      month: $("#budget-month").val(),
      year: $("#budget-month").val(),
      amount: $("#budget-amt").val(),
      remaining: $("#budget-amt").val(),
      txns: []
   });
   clear_budget_form();
});
$('#add-txn').on('click', function() {
  // ENTER & non-empty.
  var budget = budgets.findBudgetById($("#txn-budget-id").val());
  var newTxn = {
     date: $("#txn-date").val(),
     payee: $("#txn-date").val(),
     amt: $("#txn-amt").val(),
     note: $("#txn-note").val(),
  };

  if (budget.txns) {
     budget.txns.push(newTxn);
  } else {
     budget.txns = [newTxn];
  }
  hoodie.store.update('budget',
     budget.id, {txns: budget.txns, remaining:budget.remaining - $("#txn-amt").val()});

   clear_txn_form();
});
