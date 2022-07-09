const getDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
export const generateData = ({amount, expense, id, comment = ''}) => {
  return  {
    "Expense": {
      "title": [
        {
          "type": "text",
          "text": {
            "content": expense
          }
        }
      ]
    },
    "Amount": {
      "number": parseInt(amount)
    },
    "Date":{
      "date": {
        "start": new Date()
      }
    },
    "Comment":{
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": comment
          }
        }
      ]
    },
    "ID":{
      "number": id
    }
  }
}
