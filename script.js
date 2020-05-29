/*
  The model class deals with storing and updating our data structure. All of the goals are stored
  in an array. Whenever the 'goals' array is updated we store the result into local storage.
*/

class Model {
  constructor() {
    this.goals = JSON.parse(localStorage.getItem('goals')) || [];
  }

  addGoal(input) {
    const goal = {
      id: this.goals.length > 0 ? this.goals[this.goals.length - 1].id + 1 : 1,
      text: input.text,
      startDate: input.startDate,
      endDate: input.endDate,
    };

    this.goals.push(goal);

    localStorage.setItem('goals', JSON.stringify(this.goals));
  }

  editGoal(id, updatedText) {
    this.goals = this.goals.map((goal) =>
      goal.id === id
        ? {
            id: goal.id,
            text: updatedText,
            startDate: goal.startDate,
            endDate: goal.endDate,
          }
        : goal
    );

    localStorage.setItem('goals', JSON.stringify(this.goals));
  }

  deleteGoal(id) {
    this.goals = this.goals.filter((goal) => goal.id !== id);
    localStorage.setItem('goals', JSON.stringify(this.goals));
  }
}

class View {
  constructor() {
    this.inputForm = document.querySelector('.input');
    this.inputText = document.querySelector('.input__text');
    this.inputStart = document.querySelector('.input__start');
    this.inputEnd = document.querySelector('.input__end');
    this.inputBtn = document.querySelector('.input__button');
    this.today = document.querySelector('.today');
    this.goalsList = document.querySelector('.goals-list');
    this.progressBar = document.querySelector('.goal__progress-filled');
    this.percentComplete = document.querySelector('.goal__progress-percentage');
    this.temporaryEditText;
  }

  // retrieves the text and date values entered by the user
  getInput() {
    return {
      text: this.inputText.value,
      startDate: this.inputStart.value,
      endDate: this.inputEnd.value,
    };
  }

  displayGoals(goals) {
    // clears out the current list of goals in the UI and then redisplays them
    this.goalsList.innerHTML = '';

    goals.forEach((goal) => {
      let daysLeft, daysLeftText, daysCompleted, percentComplete;

      /*
        We parse the date values that are retrieved from the inputs to convert them into milliseconds.
        We add one day to the end date because if we have a date range such as 5/5/20 - 5/7/20 and
        we subtract their millisecond values, the result would be only two days because the time stamp
        for the end date is at the beginning of 5/7/20. We want the amount of days in between those 
        two dates to be three days.
      */

      const endDate = Date.parse(goal.endDate) + 1000 * 60 * 60 * 24;
      const startDate = Date.parse(goal.startDate);
      const now = Date.now();

      if (endDate > now && startDate < now) {
        daysLeft = Math.round((endDate - now) / 1000 / 60 / 60 / 24);
      } else if (startDate >= now) {
        daysLeft = Math.round((endDate - startDate) / 1000 / 60 / 60 / 24);
      } else {
        daysLeft = 0;
      }

      // 'daysLeftText' is the text we display in the UI showing how many days are left
      if (daysLeft > 0) {
        daysLeftText = daysLeft === 1 ? `${daysLeft} day left` : `${daysLeft} days left`;
      } else {
        daysLeftText = 'Completed';
      }

      const totalDays = endDate - startDate;

      /*
        'percentComplete' is the percentage value we show on the UI indicating the percentage of the total
        duration of the goal that has already passed.
      */

      if (daysLeftText === 'Completed') {
        percentComplete = 100;
      } else if (now > startDate && now < endDate) {
        daysCompleted = now - startDate;
        percentComplete = Math.round((daysCompleted / totalDays) * 100);
      } else {
        percentComplete = 0;
      }

      const html = `
        <li class="goal" id="goal-${goal.id}">
          <div class="goal__top">
            <span class="goal__text editable" contenteditable>${goal.text}</span>
            <span class="goal__dates"> : ${goal.startDate} &rarr; ${goal.endDate} (${daysLeftText})</span>
            <button class="goal__delete"><i class="ion-ios-close-outline"></i></button>
          </div>
          <div class="goal__progress">
            <div class="goal__progress-filled">
              <span class="goal__progress-percentage"></span>
            </div>
          </div>
        </li>
      `;

      this.goalsList.insertAdjacentHTML('beforeend', html);

      // fills up the progress bar in proportion with the 'percentComplete' variable
      document.querySelector(
        `#goal-${goal.id} .goal__progress-filled`
      ).style.width = `${percentComplete}%`;

      document.querySelector(
        `#goal-${goal.id} .goal__progress-percentage`
      ).textContent = `${percentComplete}%`;

      /*
        The progress bar consists of a div element ('.goal__progress-filled') inside another 
        div element (.goal__progress). The div element inside fills up the div that it's contained in 
        so if 'percentComplete' is 0 we have an empty progress bar. So we have to display '0%' on 
        that outer div and add some styling to center it. Then remove it when the 'percentComplete'
        is not 0%.
      */

      if (percentComplete === 0) {
        document.querySelector(`#goal-${goal.id} .goal__progress`).textContent = '0%';
        document.querySelector(`#goal-${goal.id} .goal__progress`).style.display = 'grid';
        document.querySelector(`#goal-${goal.id} .goal__progress`).style.alignItems = 'center';
        document.querySelector(`#goal-${goal.id} .goal__progress`).style.justifyItems = 'center';
      } else {
        document.querySelector(`#goal-${goal.id} .goal__progress`).removeAttribute('style');
      }
    });

    this.inputForm.reset();
  }

  displayTodaysDate() {
    const today = new Date().toDateString();

    this.today.textContent = today;
  }
}

class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.initialize();
  }

  ctrlAddGoal(e) {
    e.preventDefault();

    // 1. Get the input data
    const input = this.view.getInput();

    // 2. Add the goal to the model
    this.model.addGoal(input);

    // 3. Add the goal to the view
    this.view.displayGoals(this.model.goals);
  }

  ctrlDeleteGoal(e) {
    let id = e.target.parentNode.parentNode.parentNode.id;
    id = parseInt(id.split('-')[1]);

    // 1. Delete the goal from the model
    this.model.deleteGoal(id);

    // 2. Display the updated list of goals
    this.view.displayGoals(this.model.goals);
  }

  /*
    The element containing the goal's name is 'contenteditable' which means it has a live-editing functionality.
    Whenever you make any change on the text it fires an 'input' event, but we don't want to redisplay
    the entire list of goals everytime one character is changed, so we have a 'temporaryEditText' variable 
    which stores the text while it's being updated. Then when we click out of the editing box, the 'focusout' 
    event will fire which will update the goal's name by calling the 'editGoal' function. Then we clear
    the 'temporaryEditText' variable.
  */
  ctrlEditGoal(e) {
    if (e.type === 'input') {
      this.view.temporaryEditText = e.target.innerText;
    } else if (e.type === 'focusout') {
      if (this.view.temporaryEditText) {
        let id = e.target.parentNode.parentNode.id;
        id = parseInt(id.split('-')[1]);

        this.model.editGoal(id, this.view.temporaryEditText);
        this.view.temporaryEditText = '';
      }
    }
  }

  initialize() {
    this.setupEventListeners();
    this.view.displayTodaysDate();
    this.view.displayGoals(this.model.goals);
  }

  setupEventListeners() {
    this.view.inputForm.addEventListener('submit', (e) => this.ctrlAddGoal(e));
    // document.addEventListener('keydown', (e) => {
    //   if (e.keyCode === 13) this.ctrlAddGoal(e);
    // });
    this.view.goalsList.addEventListener('click', (e) => {
      if (e.target.className === 'ion-ios-close-outline') {
        this.ctrlDeleteGoal(e);
      }
    });
    this.view.goalsList.addEventListener('input', (e) => this.ctrlEditGoal(e));
    this.view.goalsList.addEventListener('focusout', (e) => this.ctrlEditGoal(e));
  }
}

const app = new Controller(new Model(), new View());
