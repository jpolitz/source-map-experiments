fun hh():
  { ff: ff }
end

fun ff():
  gg()
end

o = { hh: hh }

fun gg():
  raise("yikes")
end

o.hh().ff()

