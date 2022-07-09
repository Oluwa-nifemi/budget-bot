export const generateOptions = (options) => {
  return options.reduce((currentOptions, option) => {
    const lastArray = currentOptions[currentOptions.length - 1];
    if(lastArray && lastArray.length < 2){
      lastArray.push({
        "text": option.name,
        "callback_data": option.id,
      })
    }else{
      const newArray = [
        {
          "text": option.name,
          "callback_data": option.id,
        }
      ]

      currentOptions.push(newArray);
    }

    return currentOptions;
  },[[]])
}