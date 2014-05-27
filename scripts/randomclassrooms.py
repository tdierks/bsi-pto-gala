#!/usr/bin/python

import json
import sys
import random

classrooms = []
for year in range(1,6):
  for room in range(1,4):
    classrooms.append(str(100*year+room))

maleFirstNames = """
James John Robert Michael William David Richard Charles Joseph Thomas
Christopher Daniel Paul Mark Donald George Kenneth Steven Edward Brian
""".split()

femaleFirstNames = """
Mary Patricia Linda Barbara Elizabeth Jennifer Maria Susan Margaret
Dorothy Lisa Nancy Karen Betty Helen Sandra Donna Carol Ruth Sharon
""".split()

lastNames = """
Smith Johnson Williams Brown Jones Miller Davis Garcia Rodriguez Wilson
Martinez Anderson Taylor Thomas Hernandez Moore Martin Jackson Thompson
White
""".split()

def randomFamily():
  if random.randrange(10) < 3:
    return "{} & {} {}".format(random.choice(maleFirstNames), random.choice(femaleFirstNames), random.choice(lastNames))
  else:
    return "{} {} & {} {}".format(random.choice(femaleFirstNames), random.choice(lastNames), random.choice(maleFirstNames), random.choice(lastNames))

classParents = {}
for classroom in classrooms:
  classParents[classroom] = set()

for i in xrange(350):
  family = randomFamily()
  classParents[random.choice(classrooms)].add(family)
  if random.randrange(10) < 3:
    classParents[random.choice(classrooms)].add(family)
  if random.randrange(10) < 1:
    classParents[random.choice(classrooms)].add(family)

classOutput = []
for classroom in classrooms:
  classOutput.append({"room": classroom, "parents": list(classParents[classroom])})

print json.dumps(classOutput)
