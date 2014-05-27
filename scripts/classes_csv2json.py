#!/usr/bin/python

import sys
import argparse
import csv
import json

CLASS_H = 'CLASSROOM IN 2013-14'
FAMILY_H = 'PARENTS NAMES'

def csv_to_json(infile, outfile):
  classes = {}
  for r in csv.DictReader(infile):
    if not r[CLASS_H]: continue
    classroom = r[CLASS_H]
    classes.setdefault(classroom, []).append("Family of " + r[FAMILY_H]);
  outputRows = []
  for (room, parents) in classes.items():
    outputRows.append({'room': room, 'parents': parents})
  json.dump(outputRows,outfile)

class Usage(Exception):
  def __init__(self, msg):
    self.msg = msg

def main(argv=None, prog="PROGRAM"):
  if argv is None:
    prog = sys.argv[0]
    argv = sys.argv[1:]
  parser = argparse.ArgumentParser(prog=prog)
  parser.add_argument('infile', nargs='?', type=argparse.FileType('rU'), default=sys.stdin)
  parser.add_argument('-o', dest='outfile', type=argparse.FileType('w'), default=sys.stdout)
  args = parser.parse_args(argv)
  csv_to_json(args.infile, args.outfile)

if __name__ == "__main__":
  sys.exit(main())
