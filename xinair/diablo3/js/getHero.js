var d3client = (function() 
{
  // settings
  var _lastConfig = {},
    _totalQuestCount = 0, //meh, this number shouldn't ever change... but o well.
    _selectServer = 'en',
    _selectLocale = 'en_us',
    _questList = {
      act1: ['The Fallen Star', 'The Legacy of Cain', 'A Shattered Crown', 'Reign of the Black King', 'Sword of the Stranger', 'The Broken Blade', 'The Doom in Wortham', 'Trailing the Coven', 'The Imprisoned Angel', 'Return to New Tristram'],
      act2: ['Shadows in the Desert', 'The Road to Alcarnus', 'City of Blood', 'A Royal Audience', 'Unexpected Allies', 'Betrayer of the Horadrim', 'Blood and Sand', 'The Black Soulstone', 'The Scouring of Caldeum', 'Lord of Lies'],
      act3: ['The Siege of Bastion\'s Keep', 'Turning the Tide', 'The Breached Keep', 'Tremors in the Stone', 'Machines of War', 'Siegebreaker', 'Heart of Sin'],
      act4: ['Fall of the High Heavens', 'The Light of Hope', 'Beneath the Spire', 'Prime Evil'],
      act5: ["The Fall of Westmarch", "Souls of the Dead", "The Harbinger", "The Witch", "The Pandemonium Gate", "The Battlefields of Eternity", "Breaching the Fortress", "Angel of Death"]
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

      var battleTagSplit = $('#battleTag').val().split('#');
      if(battleTagSplit.length !== 2) {
        _onErrorCallback({reason: 'Please provide a valid battletag name#code', code:'SADFACE'});
        return;
      }

      // Save the server data.
      var heroData = {
        server: _selectServer,
        locale: _selectLocale,
        battleTagName: battleTagSplit[0],
        battleTagCode: battleTagSplit[1]
      };

      _queryUser(heroData);
    });

    // If any of our preset profiles are clicked, do an auto lookup.
    $('a.saved').click( function(e)
    {
      e.preventDefault();
      
      $("#battleTag").val( $(this).data('battletag'));

      // All the presets
      _selectServer = $(this).data('server');
      _selectLocale = $(this).data('locale');

      D3API.setServer(_selectServer);
      D3API.setLocale(_selectLocale);

      // Simulate a form submit
      $('#searchHero').submit();
    });

    // save user server when selected
    $('#selectServer li a').click(function() {
      var val = $(this).text();
      _selectServer = val;
      D3API.setServer(_selectServer);
    });

    // save user locale when selected
    $('#selectLocale li a').click(function() {
      var val = $(this).text();
      _selectLocale = val;
      D3API.setLocale(_selectLocale);
    });

    // For when a user clicks the refresh link
    $('#refresh').click(function(e){
      e.preventDefault();
      if(_lastConfig)
      {
        _queryUser(_lastConfig);
      }
    });

    // For when a user toggles an act's quest list.
    $(".actToggler").on('click', function(e){
      e.preventDefault();
      $(this).toggleClass('active, inactive');
    });
  };

  // Grab our hero data via the D3 api.
  var _queryUser = function(config)
  {
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
    $('#heroContainer .battleTagName').text(data.battleTag);
    // $('#heroContainer .data').append('<p>Quest Difficulty: ' +_difficulty+'</p>');

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

    var $newHeroBucket = $('<div class="hero-' + data.id + '"></div>');

    var totalIncomplete = totalQuestComplete = 0;

    var gender = data.gender === 0 ? ' male ' : ' female ';
    htmlHeader += '<h3 class="alert alert-info">Hero: ' +data.name
      + ' (Level '+ data.level + gender + data.class + ')</h3>';

    $.each(data.progression, function(key, val)
    {
      // Note: the top level "completed" property per act is a LIE. 
      // We will look at each quest manually...


      // build our list of quests completed.
      var totalCompleted = val.completedQuests.length,
        isEntireActComplete = false;
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

      isEntireActComplete = arrayQuestCompleted.length === _questList[key].length;

      // If the hero has not completed all the quests in the current act.
      if(!isEntireActComplete)
      {
        htmlBody += '<h4>' + key + '</h4>';

        htmlBody += '<ol>';
        // Go through the D3 quest list
        for(var i = 0; i < _questList[key].length; i++)
        {
          // Compare the names.
          var statusClass = boolQuestList[i] && boolQuestList[i].completed ? '' : 'bg-danger';
          htmlBody += '<li class="' + statusClass + '">' + _questList[key][i] + ' </li>';
        }
        htmlBody += '</ol>';
      }
      // Hero completed all the act's quests.
      else
      {
        var actListId = 'hero_' + data.id + '_' + key;
        htmlBody += '<h4>' + key + ' (complete)'
            + '<button type="button" class="btn btn-link actToggler" href="#" data-toggle="collapse" class="active" data-target="#'+actListId+'">'
            + 'Toggle Quests'
            + '</button></h4>'

        var expandable = '<div id="'+actListId+'" class="collapse">'
            + '<ol>';

          for(var i = 0; i < _questList[key].length; i++){
            expandable += '<li>'+_questList[key][i]+'</li>';

          }
          expandable += '</ol></div>';
        htmlBody += expandable;
      }


    });

    var completed = totalQuestComplete === _totalQuestCount;
    var completeClass =  completed ? ' class="alert alert-success"' : '';

    htmlMeta += '<p'+completeClass+'>Quest Completion: ' + totalQuestComplete + '/' + _totalQuestCount + '</p>';
    if(completed)
      htmlBody = '<p>You should go reset your quest progress for this hero! :)</p>';

    htmlData = htmlHeader + htmlMeta + '<div class="QuestContainer" style="display:none;">' + htmlBody + '</div>';

    // $('#heroContainer .data').append(htmlHeader);
    // $('#heroContainer .data').append(htmlData);

    $newHeroBucket.append(htmlData);
    $('#heroContainer .data').append($newHeroBucket);
    $('#refresh').removeClass('hide').show();
    
    $('.hero-' + data.id + ' h3').click(function() {
		  $(this).parent().find('.QuestContainer').slideToggle('slow');
    });
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


  var _onErrorCallback = function(data)
  {
    $('#heroContainer .battleTagName').text('Error');
    $('#heroContainer .data').html('<li>'+data.reason+' (Error code: '+data.code+')</li>');

    if(data.code !== 'SADFACE')
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
