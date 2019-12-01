/**
 * @overview ccm component for quiz multiple and single choice question
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
    name: 'quiz_choice',
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
              {tag : "img", id : 'question_img', inner : ""},
              {tag : "h3", id : 'question_text', inner : ""},
              { tag : 'div', id : "answers", inner : [] },
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
       * init is called once after all dependencies are solved 
       * and is then deleted
       */
      this.init = async () => {
        // set shortcut to help functions
        $ = self.ccm.helper;
        this.traverse_light_dom();
      };
  
      /**
       * traverse_light_dom is called on init and searches for defined answers
       * in the lightdom. These answers are used with higher priority.
       */
      this.traverse_light_dom = () => {
        /*
         * #################
         * THE SOURCE CODE IN THIS FUNCTION IS BASED AND ALMOST EQUIVALENT 
         * TO André Kless' quiz component
         * https://akless.github.io/ccm-components/quiz/ccm.quiz.js
         * #################
         */  

        //if there's no lightdom we can just skip
        if(!self.inner){
          return;
        }
        
        let answers = [];

        [ ...self.inner.children ].forEach( answer_tag => {
            // no answer tag? => skip
            if ( answer_tag.tagName !== 'CCM-CHOICE-ANSWER' ) return;

            /**
             * answer data (generated out of answer tag)
             * @type {Object}
             */
            const answer = $.generateConfig( answer_tag );
            answers.push(answer);

          } );

          // add question data to question data sets
          if(answers.length > 0){
            this.answers = answers;
          }
      } ;


      /**
       * ready is called once after the initialization and is then deleted
       */
      this.ready = async () => {
      };

      /*#####SECTION INTERFACE FOR REALTIME QUIZ COMPONENT##### */

      /*
       * In this section, all functions are implement which are required by
       * the realtime quiz component
       * /

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
      this.show_correct_answer  = () => {
        this.disabled_submit = true; 
        this.element.querySelectorAll('button').forEach((button)  => {
          button.classList.add('disabled');
        });

        if(this.type == 'single'){
          this.show_single_correct_answer();
        }
        else{
          this.show_multiple_correct_answer();
        }
      };
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
       * show_multiple_correct_answer renders correctness of given (or set)
       * answer if type is 'multiple'
       */
      this.show_multiple_correct_answer = () => {
        //When no answer is given, everything is wrong
        if(!this.given_answer){
          this.element.querySelectorAll('.multiple_wrapper').forEach(wrapper => {
              wrapper.classList.add('wrong');
          });

          return;
        }

        this.given_answer.forEach((given_answer) => {

          //get correctness
          let correct = given_answer.selected == given_answer.correct;

          //get according answer
          this.element.querySelectorAll('.multiple_wrapper')
          .forEach(wrapper => {
            let content = wrapper.querySelector('label').innerHTML;
            if(content == given_answer.value){
              if(correct){
                wrapper.classList.add('correct');
              }
              else{
                wrapper.classList.add('wrong');
              }
            }

          });
        });
      };

      /**
       * show_single_correct_answer renders correctness of given (or set) 
       * answer if type is 'single'
       */
      this.show_single_correct_answer = () => {
        //get correct answer
        this.correct_answer = null;
        this.answers.forEach(answer => {
          if(answer.correct){
            this.correct_answer = answer;
          }
        });

        this.element.querySelectorAll('button').forEach((button) => {
          if(!this.given_answer || (this.given_answer.value == button.innerHTML)){
            if(!this.given_answer || !this.given_answer.correct){
              button.classList.add('wrong');
            }
          }
         
          if(this.correct_answer.value == button.innerHTML){
            button.classList.add('correct');
          }
        });
      };


      /**
       * on_answer_callback raises the callback (which is usually set by the 
       * parent component) when the user gave an answer and the callback 
       * is defined. 
       */
      this.on_answer_callback = () => {
        if(this.answer_callback){
          this.answer_callback(this.percentage || 0, this.given_answer);
        }
      }

      /**
       * handle_single_answer returns a closure which gets called 
       * when the user gives an answer and the defined type is 'single'
       * @param {Object} answer - defined answer object from the config
       * @returns {Object} closure to handle a single given answer
       */
      this.handle_single_answer = (answer) => {
        return (event) => {
          event.stopPropagation();
          event.preventDefault();

          if(this.disabled_submit){
            return;
          }

          this.percentage = answer.correct ? 100 : 0;
          this.given_answer = answer;
          this.on_answer_callback();
        
          if(this.show_feedback){
            this.show_correct_answer();
          }
        };
      }

      /**
       * handle_multiple_answer gets called when the user gives an answer
       * and the defined type is 'multiple'
       */
      this.handle_multiple_answer = () => {
        let percentage = 0;
        let perc_answer = Math.floor(100 / this.answers.length);

        if(this.disabled_submit){
          return;
        }

        this.answers.forEach(answer => {
          if(answer.selected == answer.correct){
            percentage += perc_answer;
          }
          else{
            percentage -= perc_answer;
          }
        });
        
        if(percentage < 0){
          percentage = 0;
        }
        else if(percentage > 100){
          percentage = 100;
        }

        this.percentage = percentage;
        this.given_answer = this.answers;
        this.on_answer_callback();

          if(this.show_feedback){
            this.show_correct_answer();
          }
      }

      /**
       * get_answer_div returns the div for the answeres 
       * of the defined html structure
       * @returns {Object} The element in defined html tag which is used for 
       * rendering the answers
       */
      this.get_answer_div = () => {
        return this.html.main.inner[this.html.main.inner.length - 1].inner;
      }

      /**
       * renders_single renders all buttons for the answers 
       * if the type is 'single'
       */
      this.render_single = () => {
        this.answers.forEach(answer => {
          let button = {
            tag : 'button',
            correct : answer.correct,
            class : 'single_answer',
            inner : answer.value,
            onclick : this.handle_single_answer(answer).bind(this)
          };

          this.get_answer_div().push(button);
        });
      };

      /**
       * renders_single renders all checkboxes and labes for the answers 
       * if the type is 'multiple'
       */
      this.render_multiple = () => {
        this.answers.forEach(answer => {
          answer.selected = false;

          let id = Math.random() * (100000 - 9999999) + 100000;

          let checkbox = {
            tag : 'input',
            type : 'checkbox',
            id : id,
            class : 'multiple_answer',
            inner : answer.value,
            onchange : function(event){
              event.stopPropagation();
              event.preventDefault();

              answer.selected =  this.checked;
            }

          };

          var label = {
            tag : 'label',
            for : id,
            class : 'answer_label',
            inner : answer.value
          }

          let wrapper = {
            class : 'multiple_wrapper',
            inner : [
              checkbox, 
              label
            ]
          }

          this.get_answer_div().push(wrapper);
        });

        let submit = {
          tag : 'button',
          id : 'multiple_submit',
          inner : 'Submit',
          onclick : this.handle_multiple_answer.bind(this)
        }

        this.get_answer_div().push(submit);
      },

      /**
       * set_questions renders the question text and, if given, an according 
       * image
       */
      this.set_question = () => {
        if(this.question_text){
          this.html.main.inner[1].inner = this.question_text;
        }
        else{
          this.html.main.inner.splice(1,1)
        }

        if(this.question_image){
          this.html.main.inner[0].src = this.question_image;
        }
        else{
          this.html.main.inner.splice(0,1);
        }
      }

      /**
       * show_questions renders the whole html based on the given question type
       */
      this.show_question = () => {
        //set question
        this.set_question();

        if(this.type == 'single'){
          this.render_single();
        }
        else{
          this.render_multiple();
        }

        let html = $.html(self.html.main);
        $.setContent(self.element, html);
      };

      /**
       * unify_config applies neccessary default settings
       * @returns {Boolean} false if config is invalid, true otherwise
       */
      this.unify_config = async () => {
        if((!this.answers) || this.answers.length == 0){
          return false;
        }

        //default question type is 'single'
        if(!(this.type == 'single' || this.type == 'multiple')){
          this.type = 'single';
        }

        //by default show feedback of given answer instantly
        if( typeof this.show_feedback === 'undefined'){
          this.show_feedback = true;
        }

        return true;
      }

      /**
       * start starts the instance
       */
      this.start = async () => {
        //Abort on invalid config
        if(! await this.unify_config()){
          console.error('Invalid configuration received. App not started');
          return;
        }

        //go on by showing the actual question
        this.show_question();
        
      };

    }
  };

  function p(){window.ccm[v].component(component)}const f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{const n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"===typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{const e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}}
}
