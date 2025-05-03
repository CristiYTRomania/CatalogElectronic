const commentPostedTime = (timeInMileSec) => {
  let sec = (timeInMileSec / 1000).toFixed(0);
  let min = (timeInMileSec / (1000 * 60)).toFixed(0);
  let hrs = (timeInMileSec / (1000 * 60 * 60)).toFixed(0);
  let days = (timeInMileSec / (1000 * 60 * 60 * 24)).toFixed(0);
  let weeks = (timeInMileSec / (1000 * 60 * 60 * 24 * 7)).toFixed(0);
  let months = (timeInMileSec / (1000 * 60 * 60 * 24 * 31)).toFixed(0);
  let years = (timeInMileSec / (1000 * 60 * 60 * 24 * 12)).toFixed(0);

  if (sec < 60) {
    return "secunde";
  } else if (min < 60) {
    return min + " min";
  } else if (hrs < 24) {
    return hrs + " ore";
  } else if (days < 7) {
    return days + " zile";
  } else if (weeks < 4) {
    return weeks + " saptamani";
  } else if (months < 12) {
    return months + " luni";
  } else {
    return years + " ani";
  }
};

export { commentPostedTime };
