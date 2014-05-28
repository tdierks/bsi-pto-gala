BSI PTO Gala Website
====================

This is a static site (hosted on Google AppEngine) to host the gala tickets
and ad sales site for the BSI PTO.

Some notes for my future recollection:

  * I was planning on getting Paypal IPN notifications to fill up fundraising
    "thermometers", but didn't get around to it. There's a vestigial handler
    in Python, but it doesn't do anything.
  * Consider adding Google Analytics or similar.
  * I copied the Paypal Javascript Buttons file from Paypal because I needed
    support for submitting an entire cart in a "Buy Now" button and they didn't
    support it. I should make the change a pull request and see if they will
    accept it upstream, which would mean not using this anymore.
  * The TA fund contributions should probably be annotated with the classes
    they're for in the Paypal cart.
  * Class lists should be sorted. (In appreciations, etc.)
  * The code is a mess.
  * I'd like to have better currency input.
  * Need to test on browsers, particularly IE.
  * Required-item validation & notation doesn't need to be quite so aggressive
    (wait until you tab out?)
  * On Chrome, I'm getting both HTML validation popups and my required messages,
    which is overkill.
  * I've omitted the sources used to generate classrooms.json from this repository,
    but it's an Excel file (converted to CSV) that has a row for each student
    with two relevant columns: the classroom (3 digits, e.g. 002, 301) and
    the parents names ("John and Judy Smith" or "Sarah Jones and Janet Williams").
    The python script scripts/classes_csv2json.py converts the csv into the
    JSON the app uses.
  