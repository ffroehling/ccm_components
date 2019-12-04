/**
 * @overview ccm component for a guess picture game
 * @author André Kless <andre.kless@web.de> 2019
 * @author Felix Fröhling <felix.froehling1@gmail.com>
 * @license The MIT License (MIT)
 * @version latest (1.1.0)
 * @changes
 * version 1.1.0 (05.10.2019):
 * - support of multiple pictures
 * - added optional logged data for 'start' event
 * - added finish button
 * - uses ccm v22.7.2
 * version 1.0.0 (18.09.2019)
 * version 1.2.0 (18.09.2019)
 * Now support of realtime quiz in basic version
 */

( () => {

  const component = {

    name: 'guess_picture',

    ccm: 'https://ccmjs.github.io/ccm/versions/ccm-22.7.2.js',

    config: {
      "css": [ "ccm.load", "https://ccmjs.github.io/akless-components/guess_picture/resources/styles.css" ],
      "html": [ "ccm.load", "https://ccmjs.github.io/akless-components/guess_picture/resources/templates.html" ],
      "picture": "",
      "solution": [],
    },

    Instance: function () {

      let $, results, intervalID, pictures;

      this.ready = async () => {

        // set shortcut to help functions
        $ = this.ccm.helper;

        // logging of 'ready' event
        this.logger && this.logger.log( 'ready', $.privatize( this, true ) );
      };

      /**
       * show_correct_answer renders the correct answer and gives the user
       * the feedback to the given (or set by 'set_given_answer') answer
       */
      this.show_correct_answer = () => {
        this.show_feedback = true;
        this.show_results();

      }

      /*#####SECTION INTERFACE FOR QUIZ COMPONENT#####*/

      /**
       * set_given_answer sets a given answer to the component to get this
       * answer displayed
       * @param {Object} answer - defined answer object from the config
       */
      this.set_given_answer = (answer) => {
        //Does not make sense in this component, so ignore it here
      };

      /*#####END SECTION INTERFACE FOR QUIZ COMPONENT#####*/

      /**
       * show_results renders the results of the user
       */
      this.show_results = (results) => {
        //don't show feedback if not wished
        if(!this.show_feedback){
          return;
        }

        // remove all overlay tiles
        [ ...this.element.querySelectorAll( '.tile' ) ].forEach( tile => tile.classList.add( 'free' ) );

        // disable input field
        this.element.querySelector( '#solution input' ).disabled = true;

        // translate content
        this.lang && this.lang.translate();
      }

      /**
       * unify_config checks if the config is complete and set's vars for
       * future use
       *
       * @returns {Boolean} - true if the config is correct, false otherwise
       */
      this.unify_config = () => {
        if(!this.picture){
          return false; 
        }

        //to get into compatible state
        this.solution = this.picture.solution
        this.picture = this.picture.image;

        return true;
      }

      /**
       * start starts the instance
       */
      this.start = async () => {

        if(!this.unify_config()){
          return;
        }

        // reset result data
        results = { correct: this.size * this.size, total: this.size * this.size - 1, sections: [] };

        // adjust solution word
        this.solution = this.solution.map( solution => solution.toUpperCase().trim() );

        /** when game is finished */
        const finish = () => {

          // stop time interval
          clearInterval( this.intervalID );

          // show reached points
          this.show_results(results);

        };

        // render main HTML structure
        $.setContent( this.element, $.html( this.html.main, {

          /** image URL of the hidden picture */
          picture: this.picture,

          /** when user input has changed */
          check: event => {

            /**
             * adjusted user input
             * @type {string}
             */
            const value = event.target.value.toUpperCase().trim();
              

            // remove visual feedback
            const list = event.target.classList;
            list.remove( 'correct' );
            list.remove( 'wrong' );

            // no user input? => abort
            if ( !value ) return;

            /**
             * checks correctness of user input
             * @returns {boolean}
             */
            const isCorrect = () => {
              for ( let i = 0; i < this.solution.length; i++ )
                if ( value === this.solution[ i ] ) return true;
            };

            // check correctness of user input and give visual feedback
            if ( isCorrect() ) {
              finish();

              //calc percentage
              let percentage = Math.ceil((results.correct / results.total) * 100);
              percentage = Math.min(100, percentage); //max 100% allowed

              //answer callback to quiz component
              this.answer_callback && this.answer_callback(percentage, value);

              //prevent future callback
              this.answer_callback = null;

              //clear the text to let nobody else see this
              event.target.value = "";
            }

          }

        } ) );

        // render language area
        if ( this.lang ) { $.append( this.element.querySelector( '#top' ), this.lang.root ); this.lang.start(); }

        // render login/logout area
        if ( this.user ) $.append( this.element.querySelector( '#top' ), this.user.root );

        // consider maximum width
        if ( this.max_width ) this.element.querySelector( '#game' ).style.maxWidth = this.max_width + 'px';

        // setup tiles
        const inside = this.element.querySelector( '#inside' );
        let size = '';
        [ ...Array( this.size * this.size ) ].forEach( () => $.append( inside, $.html( this.html.tile ) ) );
        [ ...Array( this.size ) ].forEach( () => size += 'auto ' );
        inside.style[ 'grid-template-columns' ] = size;
        inside.style[ 'grid-template-rows'    ] = size;

        /**
         * contains overlay tiles
         * @type {Element[]}
         */
        const tiles = [ ...this.element.querySelectorAll( '.tile' ) ];

        // start time interval
        this.intervalID = window.setInterval( () => {

          // app has no DOM contact? => abort interval
          if ( !$.hasDomContact( this ) ) return clearInterval( this.intervalID );

          // picture is complete visible? => finish picture
          if ( !tiles.length ) return finish();

          // let a random tile disappear
          const i = Math.floor( Math.random() * tiles.length );
          tiles[ i ].classList.add( 'free' );
          tiles.splice( i, 1 );

          // loose a point
          results.correct--;

        }, this.interval );

        // focus input field for solution
        this.element.querySelector( '#solution input' ).focus();

        // translate content
        this.lang && this.lang.translate();

      };

      this.getValue = () => results;
    }

  };

  let b="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[b])return window.ccm.files[b]=component;(b=window.ccm&&window.ccm.components[component.name])&&b.ccm&&(component.ccm=b.ccm);"string"===typeof component.ccm&&(component.ccm={url:component.ccm});let c=(component.ccm.url.match(/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/)||["latest"])[0];if(window.ccm&&window.ccm[c])window.ccm[c].component(component);else{var a=document.createElement("script");document.head.appendChild(a);component.ccm.integrity&&a.setAttribute("integrity",component.ccm.integrity);component.ccm.crossorigin&&a.setAttribute("crossorigin",component.ccm.crossorigin);a.onload=function(){window.ccm[c].component(component);document.head.removeChild(a)};a.src=component.ccm.url}
} )();
