
tpl = {
  // Hash of preloaded templates for the app
  templates : {},

  // Recursively pre-load all the templates for the app.
  // This implementation should be changed in a production environment. All the template files should be
  // concatenated in a single file.
  loadTemplates : function(names, callback) {
    var that = this;

    var loadTemplate = function(index) {
      var name = names[index];
      $.get('/js/templates/' + name + '.html', function(data) {
        that.templates[name] = data;
        index++;
        if (index < names.length) {
          loadTemplate(index);
        } else {
          callback();
        }
      });
    }

    loadTemplate(0);
  },

  // Get template by name from hash of preloaded templates
  get : function(name) {
    return this.templates[name];
  }
};


/** Logs the provided message. */
function log(message) {
  if (DEBUG) {
    try {
      console.log(message);
    } catch (err) {
      // No-op.
    }
  }
}


/** Formats an epoch date string to either the default format or the provided one. */
function formatEpochDateTime(dateEpochString, format) {
  if (!format) {
    format = DEFAULT_DATE_FORMAT;
  }

  return $.format.date(new Date(parseInt(dateEpochString, 10)).toString(), format);
}


/** Formats a java date string to either the default format or the provided one. */
function formatDateTime(dateString, format) {
  if (!format) {
    format = DEFAULT_DATE_FORMAT;
  }

  return $.format.date(new Date(dateString).toString(), format);
}
