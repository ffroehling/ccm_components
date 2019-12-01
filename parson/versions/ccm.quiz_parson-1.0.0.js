/**
 * @overview ccm component for quiz parson problems
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
    name: 'quiz_parson',
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
              {tag : "h3", id : 'question_text', inner : ""},
            {
              tag : "div",
              id : "wrapper",
                inner : [

                {
                  tag : 'ul',
                  id : 'sort_elements',
                  inner : [
                    
                  ]
                },
                {
                  tag : 'ul',
                  id : 'answer_box',
                  inner : []
                },
                {
                  tag : 'button',
                  id : 'submit',
                  inner : ["Bestätigen"]
                }
              ]
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
        this.traverse_light_dom();
      };
  
      /**
       * traverse_light_dom is called on init and searches for defined elements
       * in the lightdom. These answers are used with higher priority.
       */
      this.traverse_light_dom = () => {
        if(!self.inner){
          return;
        }

        let elements = [];
        [ ...self.inner.children ].forEach( parson_tag => {
            if ( parson_tag.tagName !== 'CCM-PARSON-ELEMENT' ) return;

            
            const el = $.generateConfig( parson_tag );
            elements.push(el);
        });

        if(elements.length > 0){
          this.elements = elements;
        }
      } ;



      /**
       * ready is called once after the initialization and is then deleted
       */
      this.ready = async () => {
      };

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
        //this.given_answer = answer;
        this.sorted = answer;
      };

      /**
       * show_correct_answer renders the correct answer and gives the user
       * the feedback to the given (or set by 'set_given_answer') answer
       */
      this.show_correct_answer = () => {
        this.disable_submit();

        this.given_answer = this.sorted;

        for(var i = 0; i < this.sorted.length; i++){
          let element = this.sorted[i];
          if(!element){
            continue;
          }

          if((i+1) == element.position){
            element.correct = true;
          }
          else{
            element.correct = false;
          }
        }

        for(var i = 0; i < this.unsorted.length; i++){
          if(!this.unsorted[i]){
            continue;
          }

          //get a free element in this.sorted
          for(var j = 0; j < this.sorted.length; j++){
            if(this.sorted[j] == null){
              this.sorted[j] = $.clone(this.unsorted[i]);
              this.sorted[j].correct = false;
              break;
            }
          }
        }

        this.unsorted = $.clone(this.correct);

        this.render_elements();
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
       * on_drag_start gets called when an element has been taken by the mouse
       */
      this.on_drag_start = (element) => {
        return (event) => {
          event.dataTransfer.setData("element", element);
          this.dragged_element = element;
        }
      };

      /**
       * disable_submit prevents user from submitting an answer by
       * deactivating the according button
       */
      this.disable_submit = () => {
        this.disabled_submit = true;

        //deactivate multiple submits
        this.disabled_submit = true;
        this.element.querySelectorAll('button').forEach((button)  => {
          button.classList.add('disabled');
        });
      }

      /**
       * on_submit gets called when the user presses the submit button
       * @param {Object} event - The event object of the click 
       */
      this.on_submit = (event) => {
        if(this.disabled_submit){
          return;
        }

        if(this.sorted.indexOf(null) >= 0){
            alert('Nicht alle Elemente einsortiert');
            return;
        }

        this.disable_submit();

        let perc_answer = 100 / this.correct.length;
        let percent = 0;

        for(var i = 0; i < this.sorted.length; i++){
          let element = this.sorted[i];
          if((i+1) == element.position){
            percent += perc_answer;
          }
        }

        this.percentage = percent;
        this.on_answer_callback();

        //show feedback instant if wished
        if(this.show_feedback){
          this.show_correct_answer();
        }
      };

      /**
       * on_drag_over gets called whenever the user drags an element over
       * another element.
       * @param {Object} event - The event object of the click 
       */
      this.on_dragover = (event) => {
        let list = event.target.attributes['list'].value;
        let idx = event.target.attributes['idx'].value;
        list = list == 'sorted' ? this.sorted : this.unsorted;

        let element = list[idx];

        //allow drop only when nothing else is there
        if(!element){
          event.preventDefault();
        }
      };


      /**
       * on_drop gets called when the user drops an element to another element
       * @param {Object} event - The event object of the click 
       */
      this.on_drop = (event) => {
        event.preventDefault();

        let element = this.dragged_element; 
        let list = event.target.attributes['list'].value;
        let idx = event.target.attributes['idx'].value;
        let opposite_list = null;

        if(list == 'sorted'){
          list = this.sorted;
          opposite_list = this.unsorted;
        }
        else{
          list = this.unsorted;
          opposite_list = this.sorted;
        }

        //check that it is not a movement on the same list
        //we can see this if the element is in our own list
        if(list.indexOf(element) >= 0){
          opposite_list = list;
        }

        let r_idx = opposite_list.indexOf(element);

        //add to new list
        list[idx] = element;

        //delete from list
        opposite_list[r_idx] = null;

        this.render_elements();
      }

      /**
       * create_filled_element creates an element which can be dragged by 
       * the user (which is a parson item to be sorted in).
       * @param {String} list - The list identifier of the list the element is in
       * @param {Number} idx - The position of the element in the list
       * @param {Object} element - The parson element (from config)
       * @returns {Object} The created Tag-Element
       */
      this.create_filled_element = (list, idx, element) => {
          let e_filled = {
            tag : 'li',
            class : 'filled_element',
            draggable : true,
            ondragstart : this.on_drag_start(element),
            element : element,
            list : list,
            idx : idx,

            inner : [
              { 
                tag : 'p',
                inner : element.value
              }
            ]
          };

          if(element.correct == false){
            e_filled.class += ' wrong';
          }
          else if(element.correct == true){
            e_filled.class += ' correct';
          }

          e_filled.class += " indent_" + element.indentation;

          return e_filled;
      }

      /**
       * create_placeholder_element creates an element where the user can 
       * drop off an dragged element 
       * @param {String} list - The list identifier of the list the element is in
       * @param {Number} idx - The position of the element in the list
       * @returns {Object} The created Tag-Element
       */
      this.create_placeholder_element = (list, idx) => {
          let e_placeholder = {
            tag : 'li',
            class : 'placeholder_element',
            ondragover : this.on_dragover,
            ondrop : this.on_drop,
            list : list,
            idx : idx
          };

          return e_placeholder;
      }

      /**
       * list_elements created tags of the elements for the given list
       * (sorted or unsorted) and inserts this in the according ul
       * @param {Object} elements: The elements to be inserted to ul
       * @param {String} elements: The list identifier
       * @param {Object} ul: The ul the element will be added to
       */
      this.list_elements = (elements, list, ul) => {
        elements.forEach((element, index)=> {
          if(element){
            let e_content = this.create_filled_element(list, index, element);
            ul.inner.push(e_content);
          }
          else {
            let e_placeholder = this.create_placeholder_element(list, index);

            ul.inner.push(e_placeholder);
          }
        });
      };

      /**
       * render_elements renders the current state of the lists
       */
      this.render_elements = () => {
        //first clear it
        this.html.main.inner[1].inner[0].inner = [];
        this.html.main.inner[1].inner[1].inner = [];

        //then add elements
        this.list_elements(this.unsorted, "unsorted", self.html.main.inner[1].inner[0]);
        this.list_elements(this.sorted, "sorted", self.html.main.inner[1].inner[1]);

        let html = $.html(self.html.main);
        $.setContent(self.element, html);
      };


      /**
       * unify_config applies neccessary default settings
       * @returns {Boolean} true
       */
      this.unify_config = async () => {
        //when no position is given take it from the given order
        for(var i = 0; i < this.elements.length; i++){
          if(!this.elements[i].position ){
            this.elements[i].position = (i+1);
          }
        }

        return true;
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

        //for test
        this.unsorted = this.elements;
        this.sorted = [];
        this.correct = [];

        this.elements.forEach(element => {
          this.sorted.push(null);
          this.correct[element.position - 1] = element;
        });


        //add the question and the button listener
        this.html.main.inner[0].inner = this.question_text;
        this.html.main.inner[1].inner[2].onclick = this.on_submit;

        this.render_elements();
      };

    }

  };

  function p(){window.ccm[v].component(component)}const f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{const n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"===typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{const e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}}
}
