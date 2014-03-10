var d3client = (function() 
{
  // settings
  var _difficulty = 'normal',
    _lastConfig = {},
    _totalQuestCount = 0, //meh, this number shouldn't ever change... but o well.
    _selectServer = 'en',
    _selectLocale = 'en_us',
    _questList = {
      act1: ['The Fallen Star', 'The Legacy of Cain', 'A Shattered Crown', 'Reign of the Black King', 'Sword of the Stranger', 'The Broken Blade', 'The Doom in Wortham', 'Trailing the Coven', 'The Imprisoned Angel', 'Return to New Tristram'],
      act2: ['Shadows in the Desert', 'The Road to Alcarnus', 'City of Blood', 'A Royal Audience', 'Unexpected Allies', 'Betrayer of the Horadrim', 'Blood and Sand', 'The Black Soulstone', 'The Scouring of Caldeum', 'Lord of Lies'],
      act3: ['The Siege of Bastion\'s Keep', 'Turning the Tide', 'The Breached Keep', 'Tremors in the Stone', 'Machines of War', 'Siegebreaker', 'Heart of Sin'],
      act4: ['Fall of the High Heavens', 'The Light of Hope', 'Beneath the Spire', 'Prime Evil']
    };


  var _setupServerSelects = function()
  {
    var htmlServers = htmlLocales = '';

    for (var key in D3API.SERVERS) {
      htmlServers += '<li><a href="#" id="server_' + D3API.SERVERS[key] + '">' + D3API.SERVERS[key] + '</a></li>';
    }

    for (var key in D3API.LOCALES) {
      htmlLocales += '<li><a href="#" id="locale_"' + D3API.LOCALES[key] + '">' + D3API.LOCALES[key] + '</a></li>';
    }

    $("#selectServer").append(htmlServers);
    $("#selectLocale").append(htmlLocales);

  };

  var _setupListeners = function()
  {
    // When user submits form, it means we want a new search request.
    $('#searchHero').submit( function(e) {
      e.preventDefault();

      // Save the server data.
      var heroData = {
        server: _selectServer,
        locale: _selectLocale,
        battleTagName: $('#battleTagName').val(),
        battleTagCode: $('#battleTagCode').val()
      };

      _queryUser(heroData);
    });

    // If any of our preset profiles are clicked, do an auto lookup.
    $('a.saved').click( function(e)
    {
      // var battleVals = $(this).attr('id').split('_');
      e.preventDefault();
      
      $("#battleTagName").val( $(this).data('battletagname'));
      $("#battleTagCode").val( $(this).data('battletagcode'));

      // all the presets
      _selectServer = $(this).data('server');
      _selectLocale = $(this).data('locale');

      // simulate a form submit
      $('#searchHero').submit();


    });

    // save user server when selected
    $('#selectServer li a').click(function() {
      var val = $(this).text();
      _selectServer = val;
    });

    // save user locale when selected
    $('#selectLocale li a').click(function() {
      var val = $(this).text();
      _selectLocale = val;
    });

    $('#refresh').click(function(e){
      e.preventDefault();
      if(_lastConfig)
      {
        _queryUser(_lastConfig);

      }
    })
  };

  // Grab our hero data via the D3 api.
  var _queryUser = function(config)
  {
    // console.log('===grab hero dataa: ', config);
    if(!config.battleTagName || !config.battleTagCode) {
      console.error && console.error('Invalid query');
    }

    _lastConfig = config;

    // loading...
    $('#heroContainer .battleTagName').text('Loading...');
    $('#heroContainer .data').empty();

    D3API.getCareer({
      "battletagName": config.battleTagName,
      "battletagCode": config.battleTagCode,
      success: function(data, url, options) {
        _onSuccessCareerCallback(data, url, options);
      },
      error: function(data, url, options) {
        _onErrorCallback(data, url, options);
      }
    });

  };

  // After we first grab the user data.
  var _onSuccessCareerCallback = function(data, url, options)
  {
    // console.log('===Career success: ', data);
    $('#heroContainer .battleTagName').text(data.battleTag);
    $('#heroContainer .data').append('<p>Quest Difficulty: ' +_difficulty+'</p>');

    $.each(data.heroes, function(key, val) {
      D3API.getHero({
        "battletagName": _lastConfig.battleTagName,
        "battletagCode": _lastConfig.battleTagCode,
        "heroId":  val.id,
        success: function(data, url, options) {
          _onSuccessHeroCallback(data, url, options);
        },
        error: function(data, url, options) {
          _onErrorCallback(data, url, options);
        }
      });

    });

  };

  var _getBnetData = function() {
    $.ajax({
      url: "test.html",
      context: document.body
    }).done(function() {
      $( this ).addClass( "done" );
    });
  };

  // After we get Hero data.
  var _onSuccessHeroCallback = function(data, url, options)
  {
    var heroData = null,
      htmlData = htmlHeader = htmlBody = htmlMeta = '';

    var $newHeroBucket = $('<div class="hero"></div>');

    var totalIncomplete = totalQuestComplete = 0;
    // console.log('===Hero success: ', data);

    var gender = data.gender === 0 ? ' male ' : ' female ';
    htmlHeader += '<h3 class="alert alert-info">Hero: ' +data.name
      + ' (Level '+ data.level + gender + data.class + ')</h3>';

    $.each(data.progress[_difficulty], function(key, val)
    {
      // top level "completed" property per act is a lIE. Look at each quest manually.

      htmlBody += '<h4>' + key + '</h4><ol>';

      // build our list of quests completed.
      var totalCompleted = val.completedQuests.length;
      totalQuestComplete += totalCompleted;
      var arrayQuestCompleted = [];
      for (var i = 0; i < totalCompleted; i++)
      {
        arrayQuestCompleted.push(val.completedQuests[i].name);
      }

      // The the difference of our completed vs full list of quests.
      var array1 = _questList[key];
      var array2 = arrayQuestCompleted;
      var difference = [];

      // hash of quest names and their completion state.
      var boolQuestList = [];

      $.grep(array2, function(el, index) {
        // not found
        var isCompleted = $.inArray(el, array1) !== -1;

        if (isCompleted) {
          difference.push(el);
        }
        else {
          totalIncomplete++;
        }
        boolQuestList.push({name: el, completed: isCompleted});
      });

      // console.log('Completed: ', arrayQuestCompleted);
      // console.log('Differenc: ', boolQuestList);


      // Go through the D3 quest list
      for(var i = 0; i < _questList[key].length; i++)
      {
        // Compare the names.
        var statusClass = boolQuestList[i] && boolQuestList[i].completed ? '' : 'bg-danger';
        htmlBody += '<li class="' + statusClass + '">' + _questList[key][i] + ' </li>';
      }

      htmlBody += '</ol>';

    });

    var completeClass =  totalQuestComplete === _totalQuestCount
      ? ' class="alert alert-success"' : '';

    htmlMeta += '<p'+completeClass+'>Quest Completion: ' + totalQuestComplete + '/' + _totalQuestCount + '</p>';
    htmlData = htmlHeader + htmlMeta + htmlBody;
    // $('#heroContainer .data').append(htmlHeader);
    // $('#heroContainer .data').append(htmlData);

    $newHeroBucket.append(htmlData);
    $('#heroContainer .data').append($newHeroBucket);
    $('#refresh').removeClass('hide').show();
  };

  var _setupTotalQuestCount = function()
  {
    var total = 0;

    $.each(_questList, function(key, val) {
      for (var i = 0; i < _questList[key].length; i++)
      {
         total++;
      }
    });

    _totalQuestCount = total;
  };


  var _onErrorCallback = function(data, url, options)
  {
    $('#heroContainer .battleTagName').text('Error');
    $('#heroContainer .data').html('<li>'+data.reason+' (Error code: '+data.code+')</li>');
    $('#heroContainer .data').append('<li>Config: '+JSON.stringify(_lastConfig)+'</li>');
    $('#heroContainer').css({display: 'block'});
    $('#refresh').css({display: 'none'});

  };

  return {
    init: function() {
      _setupTotalQuestCount();
      _setupServerSelects();
      _setupListeners();

      // Set the default values of our server

    }
  }
}());


$(document).ready( function() {
  d3client.init();
})
