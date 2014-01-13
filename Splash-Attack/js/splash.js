$(document).ready(function() {
	$('[rel="tooltip"]').tooltip();

	// when hovering over icons
	$('a.icon').hover( function() 
	{
		console.log('hovered: ' + $(this).attr('id'));	
	});

	// when hovering over icons
	$('a.icon').click( function() 
	{
		$('#modal-'+ $(this).attr('id')).modal();
	});

});