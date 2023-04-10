import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './dialog/dialog.component';
import { Observable, Subscription, interval } from 'rxjs';


interface Todo {
  title: string;
  completed: boolean;
  priority: string;
  editing: boolean;
  duration?: number|null;
  startTime?: number;
  durationSubscription?: Subscription;
  timeLimit?: number|null;
  category: string;
}

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css'],
})
export class TodoComponent implements OnInit {
  todos: Todo[] = [];
  filteredTodos: Todo[] = [];
  newTodo = '';
  newTodoDuration = 1;
  filter = 'all';
  priorityFilter = 'all';
  categoryFilter = 'all';


  constructor(private snackBar: MatSnackBar, private dialog: MatDialog) {}
  //constructor(private dialog: MatDialog) { }



  ngOnInit(): void {
    this.applyFilter();
  }

  addTodo(): void {
    if (this.newTodo.trim().length > 0) {
      this.todos.push({
        title: this.newTodo.trim(),
        completed: false,
        priority: 'medium',
        editing: false,
        duration: this.newTodoDuration,
        timeLimit: this.newTodoDuration,
        category: "Other",

      });
      this.newTodo = '';
      this.newTodoDuration = 1;
      this.sortTodos();
      this.applyFilter();
    }
  }

  deleteTodo(todo: Todo): void {
    const higherPriorityExists = this.todos.some((t) => this.higherPriority(t.priority, todo.priority));
    if (!higherPriorityExists) {
      this.todos = this.todos.filter((t) => t !== todo);
      this.applyFilter();
    } else {
      this.snackBar.open('Cannot delete lower priority item before deleting higher priority items.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  updateTodo(todo: Todo): void {
    const index = this.todos.findIndex((t) => t === todo);
    this.todos[index] = todo;
    this.sortTodos();
    this.applyFilter();
  }

   getTaskColor(todo: Todo): string {
    if (todo.duration && todo.duration <= 60) {
      return 'red';
    } else if (todo.duration && todo.duration > 180) {
      return 'green';
    }
    return '';
  }

  editTodo(todo: Todo): void {
    todo.editing = true;
  }

  finishEditing(todo: Todo): void {
    todo.editing = false;
    this.updateTodo(todo);
  }


  applyFilter(): void {
    this.filteredTodos = this.todos.filter((t) => {
      const statusFilter = this.filter === 'all' || (this.filter === 'completed' && t.completed) || (this.filter === 'active' && !t.completed);
      const priorityFilter = this.priorityFilter === 'all' || this.priorityFilter === t.priority;
      const categoryFilter = this.categoryFilter === 'all' || this.categoryFilter === t.category;
      return statusFilter && priorityFilter && categoryFilter;
    })
    this.filteredTodos.forEach(todo => {
      if (todo.completed && todo.priority === 'high' && todo.duration && todo.duration <= 5) {
        this.openDialog(todo);
        todo.duration = null; // Avoid repeated dialog opening
      }
    });
  }

   openDialog(todo: Todo) {
    this.dialog.open(DialogComponent, {
      data: { taskName: todo.title }
    });
  }

  sortTodos(): void {
    this.todos.sort((a, b) => this.comparePriority(a.priority, b.priority));
  }

  comparePriority(a: string, b: string): number {
    const priorityOrder = ['high', 'medium', 'low'];
    return priorityOrder.indexOf(a) - priorityOrder.indexOf(b);
  }

  higherPriority(a: string, b: string): boolean {
    return this.comparePriority(a, b) < 0;
  }

  get activeItemsCount(): number {
  return this.todos.filter((todo) => !todo.completed).length;
}

 startTask(todo: Todo) {
  if (todo.durationSubscription) {
    todo.durationSubscription.unsubscribe();
  }
  todo.startTime = Date.now();
  todo.durationSubscription = interval(1000).subscribe(() => {
    const elapsedTime = (Date.now() - (todo.startTime || 0)) / 1000;
    const newDuration = (todo.timeLimit || 0) - elapsedTime / 60;

    if (newDuration <= 0) {
      todo.duration = 0;
      todo.durationSubscription?.unsubscribe();
    } else {
      todo.duration = newDuration;
    }
  });
}
}
