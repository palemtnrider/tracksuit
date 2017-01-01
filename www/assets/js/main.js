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

  this.add = function(budget) {
     console.log("adding budget");
    collection.push(budget);
    paint();
  };

  function paint() {
    $el.html('');
    /*
    collection.sort(function(a, b) {
      return ( a.createdAt > b.createdAt ) ? 1 : -1;
    });
    */
    for (var i = 0, len = collection.length; i<len; i++) {
      $el.append(
        '<li data-id="' + collection[i].id + '">' +
          '<input type="checkbox"> <label>' + collection[i].category + ':' + collection[i].amount + '</label>' +
          '<input type="text" value="' + collection[i].category + '"/>' +
        '</li>'
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

// when a todo changes, update the UI.
hoodie.store.on('todo:add', todos.add);
hoodie.store.on('todo:update', todos.update);
hoodie.store.on('todo:remove', todos.remove);
// clear todos when user logs out,
hoodie.account.on('signout', todos.clear);


// handle creating a new task
$('#add-todo').on('click', function() {
  // ENTER & non-empty.
   hoodie.store.add('todo', {title: $("#todoinput").val(), priority: $("#priorityinput").val()});
   $("#todoinput").val('');
});

// handle creating a new budget category
hoodie.store.on('budget:add', budgets.add);

function clear_budget_form() {
   $("#budget-amt").val('');
   $("#budget-cat").val('');
   $("#budget-month").val('');
   $("#budget-year").val('');

}
$('#add-category').on('click', function() {
  // ENTER & non-empty.
   hoodie.store.add('budget', {
      category: $("#budget-cat").val(),
      month: $("#budget-month").val(),
      year: $("#budget-month").val(),
      amount: $("#budget-amt").val(),
   });
   clear_budget_form();
});
