/**
 * @overview ccm component for matching categories 
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
    name: 'quiz_category',
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
            {tag : "h3", id : 'question_text', inner : "Placeholder"},
            {
              tag : "div",
              id : "wrapper",
              inner : [
                {
                  tag : 'ul',
                  id : 'unmatched_items',
                  inner : []
                },
                {
                  tag : 'div',
                  id : 'category_wrapper',
                  inner : []
                },
                {
                  tag : 'button',
                  id : 'submit',
                }
              ],
            }
              
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
      this.ready = async () => {
      };

      /**
       * on_answer_callback raises the callback (which is usually set by the 
       * parent component) when the user gave an answer and the callback 
       * is defined. 
       */
      this.on_answer_callback = () => {
        if(this.answer_callback){
          /*unfortunately there's a bug yet, 
           * so dont pass submitted answer and use null 
           * TODO: Fix that bug*/

          this.answer_callback(this.percentage, null);
        }
      };

      /*#####SECTION INTERFACE FOR REALTIME QUIZ COMPONENT##### */

      /**
       * set_given_answer sets a given answer to the component to get this
       * answer displayed
       * @param {Object} answer - defined answer object from the config
       */
      this.set_given_answer = (answer) => {
        this.list_categories = answer.list_categories;
        this.items = answer.items;
      };

      /**
       * show_correct_answer renders the correct answer and gives the user
       * the feedback to the given (or set by 'set_given_answer') answer
       */
      this.show_correct_answer = () => {
        //eval
        this.disable_submit();
        this.is_feedback = true;

        this.show_feedback = true; 
        this.render();
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
        event.preventDefault();
        event.stopPropagation();

        if(this.disabled_submit){
          return;
        }

        //initial percentage and fraction each answer
        let percentage = 0;
        let fraction = Math.ceil(100 / this.items.length);

        this.list_categories.forEach((category) => {
          category.matched_items.forEach(item => {
            if(category.correct_items.indexOf(item) >= 0){
              //it is correct
              percentage += fraction;
              item.is_correct = true;
            }
            else{
              // it is false
              item.is_correct = false;
              item.correct_value = category.value;
            }
          });
        });

        //limit to 100%
        percentage = Math.min(percentage, 100);

        this.percentage = percentage;
        this.given_answer = {
          list_categories : this.list_categories,
          items : this.items
        };

        //notify parent componenet
        this.on_answer_callback();

        //disable next submit
        this.disable_submit();

        //show feedback only if wished
        if(this.show_feedback){
          this.is_feedback = true;
          this.render();
        }
      };

      /**
       * on_drag_start gets called when an element has been taken by the mouse
       */
      this.on_drag_start = (item) => {
        return (event) => {
          //give element info of the tag element
          event.dataTransfer.setData("item", item);

          //and say it's currently dragged
          this.dragged_item = item;
        }
      };

      /**
       * on_drag_over gets called whenever the user drags an element over
       * another element.
       * @param {Object} event - The event object of the click 
       */
      this.on_dragover = (event) => {
        event.preventDefault();
      };

      /**
       * on_drop gets called when the user drops an element to another element
       * @param {Object} event - The event object of the click 
       */
      this.on_drop = (category) => {

        return (event) => {
          event.preventDefault();

          let item = this.dragged_item;

          //remove from old matched_category if existent
          if(item.matched_category){
            item.matched_category.matched_items.splice(
              item.matched_category.matched_items.indexOf(item), 1);
          }

          //add to new list
          category.matched_items.push(item);
          item.matched_category = category;

          this.render();
        }
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
            //list : list,
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
            //list : list,
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
       * render_item creates the html structure for an item and returns it
       *
       * @param {Object} item - The item to be rendered
       *
       * @returns {Object} - The html structure of the item
       */
      this.render_item = (item) => {
        let tag = {
          tag : 'p',
          draggable : true,
          ondragstart : this.on_drag_start(item),
          class: 'item',
          inner : item.value ,

          //for accessing it on drag&drop
          //item : item
        };

        if(this.is_feedback){
          if(item.is_correct){
            //tag.class.push('correct');
            tag.class += ' , correct';
          }
          else{
            tag.inner += ' (' + item.correct + ') ';
            tag.class += ' , wrong';
          }
        }

        return tag;
      };

      /**
       * render_category renders a category
       *
       * @param {Object} category - the category to be rendered
       *
       * @returns {Object} - The html structure of the category
       */
      this.render_category = (category) => {
        let tag = {
          tag : 'div',
          class : 'category',
          inner : [
            {
              tag : 'h4',
              inner : category.name
            },
            {
              tag : 'ul',
              inner : [] ,

              /*
               * TODO: Make dropoff possible here!!
               */
              ondragover : this.on_dragover,
              ondrop : this.on_drop(category),
            }
          ],
        }
          
        //Add already matched items to the category
        category.matched_items.forEach((item) => {
          tag.inner[1].inner.push(this.render_item(item));
        });

        return tag;
      }

      /**
       * render renders the current state of the application
       */
      this.render = () => {
        //get html structure as a clone to get it clean all the time
        let html = $.clone(this.html);
        //let html = JSON.parse(JSON.stringify(this.html));

        //set colnum for the grid (num of categories). 
        //Therefor we've a css variable
        html.main.inner[1].inner[1].style =
          "--colNum:" + this.list_categories.length;

        let unmatched_items = html.main.inner[1].inner[0].inner;
        let category_wrapper = html.main.inner[1].inner[1].inner;


        //first create all unmatched items so far 
        this.items.forEach((item) => {
          if(item.matched_category == null){
            //create it
            unmatched_items.push(this.render_item(item));
          }
        });

        //Now render all categories with matched items
        this.list_categories.forEach((category) => {
          category_wrapper.push(this.render_category(category));
        });

        //category_wrapper.style= "background:red";// + this.list_categories.length;


        //add the click listener
        html.main.inner[0].inner = this.question_text;
        html.main.inner[1].inner[2].inner = this.templates.submit;
        html.main.inner[1].inner[2].onclick = this.on_submit.bind(this);

        //And finally render
        $.setContent(self.element, $.html(html.main));

      }


      /**
       * unify_config applies neccessary default settings
       * @returns {Boolean} true if a valid config is provided, false otherwise
       */
      this.unify_config = async () => {
        //setup our datastructures and load the config values
        this.list_categories = [];

        this.categories.forEach((category) => {
          let obj = 
          { name : category, 
            correct_items : [],
            matched_items : []
          };

          this.items.forEach((item) => {
            //This way we have a double binding and can ask from either
            //the item or the category if it's matched (or correct) => comfy
            item.matched_category = null;

            if(item.correct == category){
              obj.correct_items.push(item);
            }
          });

          this.list_categories.push(obj);
        });

        //We've only a valid config when there's need to categorize something
        return this.list_categories.length > 0;
      }

      /**
       * start starts the instance
       */
      this.start = async () => {
        //cancel when there's an invalid config
        if(!this.unify_config()){
          console.error('Invalid config given');
          return;
        }

        //Render the state
        this.render();

        return;
      };

    }

  };

  function p(){window.ccm[v].component(component)}const f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{const n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"===typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{const e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}}
}
