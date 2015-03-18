(function($) {

  $(function(){

	// filter
    $('.filter-multiselect input[type=checkbox]').click(function(e){
    	window.location.href = $(this).parent().attr('href');
    });

    // menber filter
    $('.filter-number .remove').click(function(e){
      $(this).parent().parent().find('input[type="number"]').val('');
    });

    $('.filter-number .toggle').click(function(e){
      var new_name = $(this).hasClass('active') ? $(this).attr('data-off-name') : $(this).attr('data-on-name');
      $(this).parent().parent().find('input[type="number"]').attr('name', new_name);
    });

    $('#filter-menu form').submit(function(){
      $(this).find('input[type="text"],input[type="number"]').each(function(e){
        if(!$(this).val()) $(this).attr('name', '');
      });
      return true;
    });

    $('.menu-date-range form').each(function(){
      var el = $(this);
      var start_date = el.find('.calendar.date-start').datepicker({format: $.date_local.dateJSFormat, weekStart: $.date_local.weekStart, language: 'xadmin'});
      var end_date = el.find('.calendar.date-end').datepicker({format: $.date_local.dateJSFormat, weekStart: $.date_local.weekStart, language: 'xadmin'});

      var checkAvailable = function(){
        if(start_date.data('datepicker').getDate().valueOf() <= end_date.data('datepicker').getDate().valueOf()){
          el.find('button[type=submit]').removeAttr('disabled');
        } else {
          el.find('button[type=submit]').attr('disabled', 'disabled');
        }
      }

      start_date.on('changeDate', function(ev){
          var startdate = start_date.data('date');
          el.find('.start_input').val(startdate);
          end_date.data('datepicker').setStartDate(startdate);
          checkAvailable();
      });
      end_date.on('changeDate', function(ev){
          var enddate = end_date.data('date');
          el.find('.end_input').val(enddate);
          start_date.data('datepicker').setEndDate(enddate);
          checkAvailable();
      });

      checkAvailable();
    });

    $('.menu-datetime-range form').each(function(){
      var el = $(this);
      // TODO: checkAvailable ?
      var start_input = el.find('.start_input');
      var end_input = el.find('.end_input');

      $('.datetimepicker').datetimepicker();

    });

    $('.typeahead-char').each(function(){
      var search_url = $(this).attr('data-search-url');
      $(this).typeahead({
        minLength: 2,
        source: function (query, process) {
          return $.ajax({
            url: search_url,
            type: 'get',
            data: {'_q_': query},
            dataType: 'json',
            success: function(json) {
                return typeof json.options == 'undefined' ? false : process(json.options);
            }
          });
        },
        matcher: function(item) {
          return ~removeDiacritics(item.toLowerCase()).indexOf(removeDiacritics(this.query.toLowerCase()))
        }
      });
    });
  });

})(jQuery);
