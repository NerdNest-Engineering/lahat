/**
 * Calculator Mini App Component
 * A simple calculator implemented as a web component
 */

export class CalculatorComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize state
    this.state = {
      display: '0',
      firstOperand: null,
      operator: null,
      waitingForSecondOperand: false
    };
    
    // Render initial UI
    this.render();
  }
  
  // Lifecycle methods
  connectedCallback() {
    this.setupEventListeners();
  }
  
  disconnectedCallback() {
    this.removeEventListeners();
  }
  
  // Event handling
  setupEventListeners() {
    const calculator = this.shadowRoot.querySelector('.calculator');
    calculator.addEventListener('click', this.handleClick.bind(this));
  }
  
  removeEventListeners() {
    const calculator = this.shadowRoot.querySelector('.calculator');
    calculator.removeEventListener('click', this.handleClick.bind(this));
  }
  
  handleClick(event) {
    if (!event.target.matches('button')) {
      return;
    }
    
    const button = event.target;
    
    if (button.classList.contains('operator')) {
      this.handleOperator(button.value);
      this.updateDisplay();
      return;
    }
    
    if (button.classList.contains('decimal')) {
      this.inputDecimal();
      this.updateDisplay();
      return;
    }
    
    if (button.classList.contains('clear')) {
      this.resetCalculator();
      this.updateDisplay();
      return;
    }
    
    this.inputDigit(button.value);
    this.updateDisplay();
  }
  
  handleOperator(nextOperator) {
    const { firstOperand, display, operator } = this.state;
    const inputValue = parseFloat(display);
    
    if (operator && this.state.waitingForSecondOperand) {
      this.state.operator = nextOperator;
      return;
    }
    
    if (firstOperand === null) {
      this.state.firstOperand = inputValue;
    } else if (operator) {
      const result = this.performCalculation(operator, inputValue);
      this.state.display = String(result);
      this.state.firstOperand = result;
    }
    
    this.state.waitingForSecondOperand = true;
    this.state.operator = nextOperator;
  }
  
  performCalculation(operator, secondOperand) {
    if (operator === '+') {
      return this.state.firstOperand + secondOperand;
    } else if (operator === '-') {
      return this.state.firstOperand - secondOperand;
    } else if (operator === '*') {
      return this.state.firstOperand * secondOperand;
    } else if (operator === '/') {
      return this.state.firstOperand / secondOperand;
    }
    
    return secondOperand;
  }
  
  inputDigit(digit) {
    const { display, waitingForSecondOperand } = this.state;
    
    if (waitingForSecondOperand) {
      this.state.display = digit;
      this.state.waitingForSecondOperand = false;
    } else {
      this.state.display = display === '0' ? digit : display + digit;
    }
  }
  
  inputDecimal() {
    if (this.state.waitingForSecondOperand) {
      this.state.display = '0.';
      this.state.waitingForSecondOperand = false;
      return;
    }
    
    if (!this.state.display.includes('.')) {
      this.state.display += '.';
    }
  }
  
  resetCalculator() {
    this.state.display = '0';
    this.state.firstOperand = null;
    this.state.operator = null;
    this.state.waitingForSecondOperand = false;
  }
  
  updateDisplay() {
    const display = this.shadowRoot.querySelector('.calculator-display');
    display.value = this.state.display;
  }
  
  // Render method
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, sans-serif;
          --calculator-bg: #f0f0f0;
          --display-bg: #fff;
          --btn-bg: #e0e0e0;
          --btn-hover: #d0d0d0;
          --btn-active: #b0b0b0;
          --operator-bg: #f8a51d;
          --operator-hover: #e59317;
          --operator-active: #d68210;
        }
        
        .calculator {
          width: 300px;
          margin: 0 auto;
          background-color: var(--calculator-bg);
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          padding: 20px;
          box-sizing: border-box;
        }
        
        .calculator-display {
          width: 100%;
          height: 60px;
          font-size: 2.5rem;
          text-align: right;
          padding: 0 15px;
          margin-bottom: 20px;
          border: none;
          border-radius: 8px;
          background-color: var(--display-bg);
          box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.1);
          box-sizing: border-box;
        }
        
        .calculator-keys {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-gap: 10px;
        }
        
        button {
          height: 60px;
          font-size: 1.5rem;
          border: none;
          border-radius: 8px;
          background-color: var(--btn-bg);
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        button:hover {
          background-color: var(--btn-hover);
        }
        
        button:active {
          background-color: var(--btn-active);
        }
        
        .operator {
          background-color: var(--operator-bg);
          color: white;
        }
        
        .operator:hover {
          background-color: var(--operator-hover);
        }
        
        .operator:active {
          background-color: var(--operator-active);
        }
        
        .clear {
          grid-column: 1 / 3;
        }
        
        .equal-sign {
          grid-column: 4;
          grid-row: 2 / 6;
          height: auto;
        }
      </style>
      
      <div class="calculator">
        <input type="text" class="calculator-display" value="${this.state.display}" disabled>
        
        <div class="calculator-keys">
          <button class="clear" value="clear">AC</button>
          <button class="operator" value="/">&divide;</button>
          <button class="operator" value="*">&times;</button>
          
          <button value="7">7</button>
          <button value="8">8</button>
          <button value="9">9</button>
          <button class="operator" value="-">-</button>
          
          <button value="4">4</button>
          <button value="5">5</button>
          <button value="6">6</button>
          <button class="operator" value="+">+</button>
          
          <button value="1">1</button>
          <button value="2">2</button>
          <button value="3">3</button>
          
          <button value="0">0</button>
          <button class="decimal" value=".">.</button>
          <button class="equal-sign operator" value="=">=</button>
        </div>
      </div>
    `;
  }
}

// Register the component
customElements.define('calculator-component', CalculatorComponent);
