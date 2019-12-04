/**
 * @overview ccm component for quiz assess excercises
 * @author Felix Fröhling <felix.froehling1@gmail.com> 2019
 * @license The MIT License (MIT)
 * @version latest (1.0.0)
 */

{

  var component  = {

    /**
     * unique component name
     * @type {string}
     */
    name: 'quiz_assess',
    version: [1,0,0],
    
    ccm: 'https://ccmjs.github.io/ccm/versions/ccm-20.7.2.js',

    /**
     * default instance configuration
     * @type {object}
     */
    config: {
      html: {
        main: {
          inner: [
            {tag : 'h3', id : 'question'},
            {
              tag : 'input', 
              id : 'answer',
              type : "number",
            },
            {
              tag : 'button', 
              id : 'submit'
            },
          ]
        }
      }
    },

    /**
     * for creating instances of this component
     * @constructor
     */
    Instance: function () {

      "use strict";

      /**
       * own reference for inner functions
       * @type {Instance}
       */
      const self = this;

      /**
       * shortcut to help functions
       * @type {Object.<string,function>}
       */
      let $;

      /**
       * init is called once after all dependencies are solved and is then deleted
       */
      this.init = async () => {
        // set shortcut to help functions
        $ = self.ccm.helper;
      };

      /**
       * ready is called once after the initialization and is then deleted
       */
      this.ready = async () => {};

      /**
       * on_answer_callback raises the callback (which is usually set by the 
       * parent component) when the user gave an answer and the callback 
       * is defined. 
       */
      this.on_answer_callback = () => {
        if(this.answer_callback){
          this.answer_callback(this.percentage, this.given_answer);
        }
      };

      /*#####SECTION INTERFACE FOR REALTIME QUIZ COMPONENT##### */

      /**
       * set_given_answer sets a given answer to the component to get this
       * answer displayed
       * @param {Object} answer - defined answer object from the config
       */
      this.set_given_answer = (answer) => {
        this.given_answer = answer;
      };

      /**
       * show_correct_answer renders the correct answer and gives the user
       * the feedback to the given (or set by 'set_given_answer') answer
       */
      this.show_correct_answer = () => {
        let deviation = Math.abs(this.given_answer - this.correct) ;
        if(!deviation && deviation !== 0){
          deviation = "None";
        }

        let html = {
          tag : 'div',
          id : 'correct_answer',
          inner : [
            {tag : 'h3', inner : (this.template.your_answer || 'Your answer') + ': ' + this.given_answer || "None"
            },
            {tag : 'h3', inner : (this.template.correct_answer || 'Correct answer') + ': ' + this.correct
            },
            {tag : 'h3', inner : (this.template.deviation || 'Deviation') +
              ': ' + deviation
            }
          ]
        }

        $.setContent(self.element, $.html(html));
      }
      /*#####END SECTION INTERFACE FOR REALTIME QUIZ COMPONENT##### */

      /*#####SECTION INTERFACE FOR LEARNING ANALYTICS COMPONENT##### */

      /*
       * In this section, all functions are implemented which are required by
       * LA-Components. Therefore a standard has been developed. See 
       * https://github.com/ccmjs/ccm/wiki/Analytics-Schnittstelle for details
       * /
       */

      /**
       * getValue returns the data to be analyzed by the defined convention
       * @returns {Object} result data of the component
       */
      this.getValue = () => {
        if(!this.given_answer){
          return {};
        }

        let result = {
          total : 100, //percentage to reach
          correct : this.percentage,
          created_at : new Date().toISOString(),
          updated_at : new Date().toISOString(),
        };

        //when nothing's given yet => return defaults
        if(!this.given_answer){
          result.total = 0;
          result.correct = 0;
        }

        return result;
      }

      /*#####END SECTION INTERFACE FOR LEARNING ANALYTICS COMPONENT##### */

      /**
       * disable_submit prevents user from submitting an answer by
       * deactivating the according button
       */
      this.disable_submit = () => {
        this.disabled_submit = true;
      }

      /**
       * on_submit gets called when the user presses the submit button
       * @param {Object} event - The event object of the click 
       */
      this.on_submit = (event) => {
        let answer = self.element.querySelector('#answer').value;

        if(!answer || this.disabled_submit){
          return;
        }

        //convert answer to int
        answer = Number(answer);
  
        //get deviation
        let deviation = Math.abs(this.correct - answer);
        let percentage;

        //check if it's good or bad
        if(deviation <= this.deviation.best){ //reached best
          percentage = 100; 
        }
        else if(deviation >= this.deviation.worst){ //totally wrong
          percentage = 0; 
        }
        else{
          //calculate the range for one percent
          let frac_perc = 
            Math.ceil((this.deviation.worst - this.deviation.best) / 100);

          //And calculate the reached percentage
          percentage = (100 - 
            Math.ceil((deviation - this.deviation.best)/ frac_perc));
        }

        //set globally
        this.percentage = percentage;
        this.given_answer = answer;

        this.on_answer_callback();

        //show feedback if wished
        if(this.show_feedback){
          this.show_correct_answer();
        }
      };

      /**
       * render renders the components ui
       */
      this.render = () => {
        let html = $.clone(this.html.main);
         
        //first of all set texts 
        html.inner[0].inner = this.question_text || "Question";
        html.inner[1].placeholder = 
          this.template.answer_placeholder || 'Type answer here';
        html.inner[2].inner = 
          this.template.submit || 'Submit';

        //now set callback and events
        html.inner[2].onclick = this.on_submit.bind(this);

        //finally set the content
        $.setContent(self.element, $.html(html));
      }

      /**
       * unify_config applies neccessary default settings
       * @returns {Boolean} true
       */
      this.unify_config = async () => {
        //When according values and templates are given the config is fine
        return this.template && 
          this.correct &&
          this.deviation && 
          this.deviation.best && 
          this.deviation.worst;
      }

      /**
       * start starts the instance
       */
      this.start = async () => {
        //self.html.main.inner[2].onclick = this.submit;
        //this.render();
        if(!this.unify_config()){
          return;
        }

        this.render();
      };

    }

  };

  function p(){window.ccm[v].component(component)}const f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{const n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"===typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{const e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}}
}
