fun h():
  { f: f }
end

fun f():
  g()
end

o = { h: h }

fun g():
  raise("yikes")
end

o.h().f()

