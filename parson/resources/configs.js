ccm.files[ 'configs.js' ] = {
  "hello_world" : {
    "css" : ["ccm.load", "resources/style.css"],
    "question_text" : "Create a Hello World program in C!",
    "elements": [
      {"value" : "int main(int argc, char** argv){", "position" : 1, "indentation" : 0} ,
      {"value" : "printf('Hello World');", "position" : 2, "indentation" : 1},
      {"value" : "return 0;", "position" : 3, "indentation" : 1},
      {"value" : "}", "position" : 4, "indentation" : 0}
    ]
  }
}
