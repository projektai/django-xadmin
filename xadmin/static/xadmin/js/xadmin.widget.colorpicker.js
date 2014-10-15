;(function($){

  $('.colorpicker').each(function () {
    $(this).spectrum({
        preferredFormat: "hex",
        allowEmpty: true,
        showInput: true,
        showInitial: true,
        cancelText: gettext('Cancel'),
        chooseText: gettext('Choose'),
    });
  });

})(jQuery)
