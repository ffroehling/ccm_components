/*
 * This is a module which offers interface to render specific uis to screen
 */

var ui = {
  /*
   * Constructor
   * 
   * @param {Object} ccm - The ccm object
   * @param {Object} element - The element to render in
   */
  Instance : function(ccm, element) { 
    this.ccm = ccm;
    this.element = element;

    /*
     * We have a  procedure div for rendering quiz specific options
     * and a method_div where sub components get renderd in
     */
    let procedure_content = {
      tag : 'div',
      id : 'procedure_wrapper',
      inner : []
    };

    let method_content = {
      tag : 'div',
      id : 'method_wrapper',
      inner : []
    };

    this.content = {
      tag : 'div', 
      inner : [
        procedure_content,
        method_content
      ]
    };

    return this;
  },

  /*
   * Renders the divs
   */
  render : function () {
    let html = this.ccm.helper.html(this.content);
    this.ccm.helper.setContent(this.element, html);
  },

  /*
   * clears the procedure div
   */
  clear_procedure_content : function (){
    this.content.inner[0].inner = [];
  },

  /*
   * clears the method div
   */
  clear_method_content : function (){
    this.content.inner[1].inner = [];
  },

  /*
   * sets the content of the procedure div
   *
   * @param {Object} content - The content to set
   */
  set_procedure_content : function(content){
    this.content.inner[0].inner = content;
  },

  /*
   * sets the content of the method div
   *
   * @param {Object} content - The content to set
   */
  set_method_content : function(content){
    this.content.inner[1].inner = content;
  },

  /*
   * renders a message to the screen
   *
   * @param {String} message - The message to be shown
   * @param {String} css_class - (optional) specific css class if wished
   */
  show_message : function(message, css_class) {
    if(!css_class){
      css_class = 'message'
    }

    let msg_div = {
      tag: 'div',
      id : 'message_wrapper',
      inner : [
        {tag : 'h3', class : css_class, id : 'message', 
          inner : [message]}
      ]
    };

    this.set_procedure_content(msg_div);
    this.render();
  },

  /*
   * renders a state to the screen
   *
   * @param {String} state - The state to be shown
   * @param {String} css_class - (optional) specific css class if wished
   */
  show_state : function(state, css_class){

    if(!css_class){
      css_class = 'state'
    }

    let state_div= {
      tag: 'div',
      id : 'state_wrapper',
      inner : [
        {tag : 'h3', class : css_class, id : 'state', 
          inner : state
        }
      ]
    };

    this.set_procedure_content(state_div);
    this.render();
  },

  /*
   * Renders the prepare screen for a question
   *
   * @param {Object} template - Template object with specific strings
   * @param {Object} question - The current question object to be shown
   */
  prepare_question : async function(template, question){
    return new Promise((resolve, reject) => {
      //get prepare time
      let prepare_time = question.prepare_time;

      //build string based on question mode from the templates
      var mode_desc = template.prepare.mode_relax_no_timeout;
      var timer = question.prepare_time;

      if(question.mode == 'mode_first'){
        mode_desc = template.prepare.mode_first;
      }
      else if(question.mode == 'mode_order'){
        mode_desc = template.prepare.mode_order;
      }
      else{
        if(question.timeout){
          mode_desc = template.prepare.mode_relax_timeout;
        }
      }

      //build tag
      let div = {
        tag  : 'div',
        id  : 'prepare_question',
        class : 'div_wrapper',
        inner : [
          {tag : 'h3', id : 'prepare_wrapper', inner : template.prepare.get_ready},
          {tag : 'p', id : 'prepare_mode', inner : mode_desc},
          {tag : 'h1', id : 'prepare_timer', inner : timer}
        ]
      };

      //countdown
      interval = setInterval(() => {
        if(timer == 0){
          clearInterval(interval);
          resolve();
          return;
        }

        div.inner[div.inner.length - 1].inner = timer; 
        timer -= 1;

        this.set_procedure_content(div);
        this.render();
      }, 1000);

    });
  },

  /*
   * Shows the buzzer for mode_first questoins
   *
   * @param {Object} template - Template object with specific strings
   * @param {Object} question - The current question object to be shown
   */
  show_question_buzzer : async function (template, question){
    return new Promise((resolve, reject) => {
      let div = {
        tag  : 'div',
        id  : 'question_buzzer_wrapper',
        class : 'div_wrapper',
        inner : [
          {
            tag : 'h3', id : 'question', class : 'question',
            inner : question.text, 
          },
          {
            tag : 'button', id : 'question_buzzer', 
            inner : template.question.buzzer, 
            onclick : () => {resolve()}
          }
        ]
      };
      
      this.set_procedure_content(div);
      this.render();
    });
  },
        
  /*
   * Renders  the screen when somebody buzzed in mode_first
   *
   * @param {Object} template - Template object with specific strings
   * @param {Object} question - The current question object to be shown
   * @param {String} fastest - The username which was the fastest
   *
   * @returns {Promise} - resolves when user clicked a button with the 
   * according percentage (0/50/100)
   */
  show_master_decide_correctness : async function(template, question, fastest){
    return new Promise((resolve, reject) => {
      let div = {
        tag  : 'div',
        id  : 'question_master_decide_wrapper',
        class : 'div_wrapper',
        inner : [
          
          {
            tag : 'h3', id : 'answer_header', 
            inner : template.question.answer_given.replace('<PLAYER>', fastest),
          },
          {
            tag : 'button', id : 'answer_correct', 
            inner : template.question.answer_correct, 
            onclick : () => {resolve(100)}
          },
          {
            tag : 'button', id : 'answer_part_correct', 
            inner : template.question.answer_part_correct, 
            onclick : () => {resolve(50)}
          },
          {
            tag : 'button', id : 'answer_incorrect', 
            inner : template.question.answer_incorrect, 
            onclick : () => {resolve(0)}
          }
        ]
      };
      
      this.set_procedure_content(div);
      this.render();
    });
  },

  /*
   * Renders the dialog for showing the next question manually
   *
   * @param {Object} template - Template object with specific strings
   *
   * @returns {Promise} - resolves when user clicked next
   */
  show_next_question_dialog : async function(template){
    return new Promise((resolve, reject) => {
      let div = {
        tag  : 'div',
        id  : 'next_question_wrapper',
        class : 'div_wrapper',
        inner : [
          {
            tag : 'button', id : 'next_question', 
            inner : template.question.next_question, 
            onclick : () => {resolve()}
          }
        ]
      };
      

      this.set_procedure_content(div);
      this.render();
    });
  },

  /*
   * renders the timeout for a question
   *
   * @param {Number} timeout - The timeout in [s]
   * @param {Function} timeout_callback - Fucntion to call when the timeout 
   * happened
   */
  show_timeout : function(timeout, timeout_callback) {
    //when no timeout is configured, to nothing
    if(!timeout){
      return;
    }

    let timeout_value = timeout + 1;

    render_timeout = () => {
      timeout_value -= 1;

      if(timeout_value == 0){
        //clear the interval
        this.stopTimeoutInterval();

        //and call the callback
        timeout_callback();
        return;
      }

      let tag = {
        tag : 'h3',
        id : 'timeout',
        inner : timeout_value.toString()
      }

      let procedure_element = this.element.querySelector('#procedure_wrapper');

      if(procedure_element){
        self.ccm.helper.setContent(procedure_element, self.ccm.helper.html(tag));
      }
    }

    //show initial
    render_timeout();

    //recursive call
    this.timeout_interval = setInterval(render_timeout.bind(this), 1000);
  },

  /*
   * Stops a running timeout
   */
  stopTimeoutInterval : function() {
    if(this.timeout_interval){
      clearInterval(this.timeout_interval);
    }
  },

  /*
   * Renders a quiz method to screen
   *
   * @param {CCM Instance} method - The quiz method instance
   */
  show_method : async function(method){
    //First make our dom empty
    this.clear_procedure_content();
    this.clear_method_content();
    
    //Show timeout
    this.render();

    //disable auto feedback of method
    method.show_feedback = false;

    //Now get the element of the method_wrapper
    let e = this.element.querySelector('#method_wrapper');

    //add to element
    e.appendChild(method.root);

    //(re)start the method
    method.start();

    //save to local reference
    this.current_instance = method;
  },

  /*
   * Shows a correct answer of the current question 
   * (based on the current component)
   */
  show_correct_answer : function(){
    if(!this.current_instance){
      //sth wrong here, this should not occur
      return;
    }

    method.show_feedback = true;

    //First make our dom empty
    this.clear_procedure_content();
    this.clear_method_content();
    this.render();

    //Now get the element of the method_wrapper
    let e = this.element.querySelector('#method_wrapper');

    //append to div
    e.appendChild(this.current_instance.root);

    //finally show the ansser
    this.current_instance.show_correct_answer();
  },

  /*
   * Renders the scoreboard based on the gamificatoin instance
   *
   * @param {CCM Instance} gamification : The instance of the gamification component
   */
  show_scoreboard : function (gamification) {
    //First make our dom empty
    this.clear_procedure_content();
    this.clear_method_content();
    this.render();

    //get element
    let e = this.element.querySelector('#method_wrapper');

    //append to div
    e.appendChild(gamification.root);

    //and now show the scoreboard
    gamification.show_scoreboard();
  },

  /*
   * Renders retrieved points based on the gamification instance
   * @param {CCM Instance} gamification : The instance of the gamification component
   */
  show_points : function (gamification) {
    //First make our dom empty
    this.clear_procedure_content();
    this.clear_method_content();
    this.render();

    //get element
    let e = this.element.querySelector('#method_wrapper');

    //append to div
    e.appendChild(gamification.root);

    //and now show the scoreboard
    gamification.show_last_points();
  },

  show_finish_button : function(template, finish){
    let tag = {
      tag : 'button',
      id : 'on_finish',
      inner : template.messages.finish,
      onclick : finish
    }

    let procedure_element = this.element.querySelector('#procedure_wrapper');

    if(procedure_element){
      self.ccm.helper.setContent(procedure_element, self.ccm.helper.html(tag));
    }
  }
}
