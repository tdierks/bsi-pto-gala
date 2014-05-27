#!/usr/bin/env python

import logging
import webapp2
import os
import os.path

debug = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')

config = {
}

class IPNHandler(webapp2.RequestHandler):
  def get(self):
    logging.info("Got IPN")
    self.response.status = '200 OK'
    self.response.write("OK")

app = webapp2.WSGIApplication([
  webapp2.Route(r'/paypal-ipn', IPNHandler),
], debug = debug, config = config)

logging.getLogger().setLevel(logging.DEBUG)

