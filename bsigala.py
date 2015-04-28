#!/usr/bin/env python

import logging
import webapp2
import os
import os.path
import httplib2
from datetime import datetime
from google.appengine.api import memcache
from oauth2client.appengine import AppAssertionCredentials
from oauth2client.client import SignedJwtAssertionCredentials
from gdata.gauth import OAuth2TokenFromCredentials
from gdata.spreadsheets.client import SpreadsheetsClient
from gdata.spreadsheets.data import ListEntry
import json
from apiclient.discovery import build
from StringIO import StringIO
from apiclient.http import MediaIoBaseUpload

debug = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')

config = {
}

class Creds(object):
  def __init__(self, scope):
    if os.environ['SERVER_SOFTWARE'].startswith('Development'):
      with open('bsi-pto-5ca756732f12.json', 'r') as creds_file:
        creds_data = json.load(creds_file)
      self.creds = SignedJwtAssertionCredentials(creds_data['client_email'], creds_data['private_key'],
        scope=scope)
    else:
      self.creds = AppAssertionCredentials(scope=scope)
    self.authToken = OAuth2TokenFromCredentials(self.creds)

class OutputWorksheet(object):
  def __init__(self, creds, sheet_title):
    self.creds = creds
    self.sheet_title = sheet_title
    self.sheet_key = None
    self.worksheet_id = None

  def client(self):
    sheetsClient = SpreadsheetsClient(auth_token = self.creds.authToken)
    sheetsClient = self.creds.authToken.authorize(sheetsClient)
    return sheetsClient
  
  def findSheet(self):
    if not self.sheet_key or not self.worksheet_id:
      sheetsClient = self.client()
      sheets = sheetsClient.GetSpreadsheets()
      matchingSheets = [sheet for sheet in sheets.entry if sheet.title.text == self.sheet_title]
      if len(matchingSheets) == 0:
        logging.warn("Couldn't find output spreadsheet")
      else:
        self.sheet_key = matchingSheets[0].get_spreadsheet_key()
        wss = sheetsClient.GetWorksheets(self.sheet_key)
        self.worksheet_id = wss.entry[0].get_worksheet_id()
    return (self.sheet_key, self.worksheet_id)

class FilesFolder(object):
  def __init__(self, creds, folder_name):
    self.creds = creds
    self.parent_id = None
    self.folder_name = folder_name
    self.driveService = None

  def service(self):
    if not self.driveService:
      http = self.creds.creds.authorize(httplib2.Http())
      self.driveService = build('drive', 'v2', http=http)
    return self.driveService
  
  def findParent(self):
    if not self.parent_id:
      driveService = self.service()
      q = "title = '{}' and mimeType = 'application/vnd.google-apps.folder'".format(self.folder_name)
      folders = driveService.files().list(q=q).execute()
      if folders and 'items' in folders and folders['items']:
        self.parent_id = folders['items'][0]['id']
    return self.parent_id

SCOPES = [
  'https://spreadsheets.google.com/feeds',
  'https://www.googleapis.com/auth/devstorage.full_control',
  'https://www.googleapis.com/auth/drive',
]

creds = Creds(SCOPES)
worksheet = OutputWorksheet(creds, "Gala Ads")
folder = FilesFolder(creds, "Gala Ads Images")

class IPNHandler(webapp2.RequestHandler):
  def get(self):
    logging.info("Got IPN")
    self.response.status = '200 OK'
    self.response.write("OK")

class SheetTest(webapp2.RequestHandler):
  def post(self):
    logging.info("Name {}, email {}".format(self.request.POST['name'], self.request.POST['email']))
    if 'file' in self.request.POST and self.request.POST['file'].file:
      media = MediaIoBaseUpload(self.request.POST['file'].file, self.request.POST['file'].type)
      http = creds.creds.authorize(httplib2.Http())
      drive_service = build('drive', 'v2', http=http)
      f = drive_service.files().insert(body = {
        'mimeType': self.request.POST['file'].type,
        'title': 'test ' + str(datetime.now()),
        'parents': [ { 'id': folder.findParent() }],
      }, media_body = media).execute()

class SubmitAd(webapp2.RequestHandler):
  def post(self):
    file_link = None
    if 'file' in self.request.POST and self.request.POST['file'].file:
      fileName = "{} ({})".format(self.request.POST['file'].filename, self.request.POST['name'])
      description = "Name: {}, Email: {}, Phone: {}, Size: {}".format(self.request.POST['name'],
        self.request.POST['email'], self.request.POST['phone'], self.request.POST['ad_size'])
      media = MediaIoBaseUpload(self.request.POST['file'].file, self.request.POST['file'].type)
      http = creds.creds.authorize(httplib2.Http())
      drive_service = build('drive', 'v2', http=http)
      f = drive_service.files().insert(body = {
        'mimeType': self.request.POST['file'].type,
        'title': fileName,
        'description': description,
        'parents': [ { 'id': folder.findParent() }],
      }, media_body = media).execute()
      file_link = f['alternateLink']
    sheet_key, worksheet_id = worksheet.findSheet()
    if sheet_key:
      sheetsClient = worksheet.client()
      newRow = ListEntry()
      newRow.from_dict({
        'time': str(datetime.now()),
        'name': self.request.POST['name'],
        'email': self.request.POST['email'],
        'phone': self.request.POST['phone'],
        'type': self.request.POST['ad_type'],
        'size': self.request.POST['ad_size'],
        'layout': self.request.POST['ad_layout'],
        'font': 'ad_font' in self.request.POST and self.request.POST['ad_font'] or "",
        'text': 'ad_text' in self.request.POST and self.request.POST['ad_text'] or "",
        'design': 'ad_design' in self.request.POST and self.request.POST['ad_design'] or "",
        'image': file_link or "none",
      })
      sheetsClient.AddListEntry(newRow, sheet_key, worksheet_id, creds.authToken)
      
app = webapp2.WSGIApplication([
  webapp2.Route(r'/paypal-ipn', IPNHandler),
  webapp2.Route(r'/sheet-test', SheetTest),
  webapp2.Route(r'/submit-ad', SubmitAd),
], debug = debug, config = config)

logging.getLogger().setLevel(logging.DEBUG)

