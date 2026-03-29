# Benchmarks

## dev0

```
 ✓ tests/benchmark.bench.ts > size 2811ms
     name                                hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · protodef-ts                 217,266.58  0.0033  0.1893  0.0046  0.0045  0.0187  0.0223  0.0617  ±0.48%   108634
   · node-protodef               239,393.56  0.0038  0.2050  0.0042  0.0042  0.0058  0.0084  0.0120  ±0.36%   119697
   · node-protodef (compiled)  4,902,310.89  0.0002  0.1019  0.0002  0.0002  0.0002  0.0003  0.0004  ±0.23%  2451156

 ✓ tests/benchmark.bench.ts > size + write 2098ms
     name                                hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · protodef-ts                 109,453.52  0.0078  0.2860  0.0091  0.0090  0.0138  0.0158  0.1095  ±0.43%    54727
   · node-protodef               114,025.78  0.0080  0.4066  0.0088  0.0087  0.0131  0.0140  0.0231  ±0.37%    57013
   · node-protodef (compiled)  1,339,452.11  0.0007  0.1521  0.0007  0.0007  0.0010  0.0012  0.0046  ±0.22%   669727

 ✓ tests/benchmark.bench.ts > read 2196ms
     name                                hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · protodef-ts                  42,472.92  0.0140  9.4545  0.0235  0.0160  0.0265  0.0310  3.0114  ±9.37%    21237
   · node-protodef               179,297.49  0.0050  0.2397  0.0056  0.0055  0.0093  0.0105  0.0160  ±0.37%    89649
   · node-protodef (compiled)  1,794,780.99  0.0005  0.2077  0.0006  0.0005  0.0008  0.0008  0.0013  ±0.38%   897391

 BENCH  Summary

  node-protodef (compiled) - tests/benchmark.bench.ts > size
    20.48x faster than node-protodef
    22.56x faster than protodef-ts

  node-protodef (compiled) - tests/benchmark.bench.ts > size + write
    11.75x faster than node-protodef
    12.24x faster than protodef-ts

  node-protodef (compiled) - tests/benchmark.bench.ts > read
    10.01x faster than node-protodef
    42.26x faster than protodef-ts
```

## dev1

```
 ✓ tests/benchmark.bench.ts > size 2841ms
     name                                hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · protodef-ts                 355,565.72  0.0026  0.6413  0.0028  0.0027  0.0058  0.0070  0.0480  ±0.44%   177783
   · node-protodef               241,484.44  0.0037  0.1863  0.0041  0.0041  0.0058  0.0084  0.0117  ±0.29%   120743
   · node-protodef (compiled)  4,871,591.08  0.0002  2.2436  0.0002  0.0002  0.0003  0.0004  0.0005  ±0.92%  2435807

 ✓ tests/benchmark.bench.ts > size + write 2113ms
     name                                hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · protodef-ts                 136,112.26  0.0064  0.2183  0.0073  0.0073  0.0115  0.0127  0.0953  ±0.42%    68057
   · node-protodef               114,358.94  0.0080  0.3336  0.0087  0.0087  0.0134  0.0140  0.0215  ±0.34%    57180
   · node-protodef (compiled)  1,402,838.60  0.0007  0.1523  0.0007  0.0007  0.0010  0.0011  0.0045  ±0.12%   701420

 ✓ tests/benchmark.bench.ts > read 2185ms
     name                                hz     min     max    mean     p75     p99    p995    p999      rme  samples
   · protodef-ts                  46,373.95  0.0117  8.7300  0.0216  0.0134  0.0224  0.0265  3.3272  ±10.63%    23187
   · node-protodef               180,490.23  0.0050  0.2019  0.0055  0.0055  0.0092  0.0102  0.0168   ±0.35%    90246
   · node-protodef (compiled)  1,823,626.78  0.0005  0.1391  0.0005  0.0005  0.0008  0.0009  0.0013   ±0.09%   911814

 BENCH  Summary

  node-protodef (compiled) - tests/benchmark.bench.ts > size
    13.70x faster than protodef-ts
    20.17x faster than node-protodef

  node-protodef (compiled) - tests/benchmark.bench.ts > size + write
    10.31x faster than protodef-ts
    12.27x faster than node-protodef

  node-protodef (compiled) - tests/benchmark.bench.ts > read
    10.10x faster than node-protodef
    39.32x faster than protodef-ts
```

## codec rewrite

```
✓ tests/benchmark.bench.ts > size 3338ms
     name                                hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · protodef-ts               2,340,204.10  0.0004  0.1891  0.0004  0.0004  0.0008  0.0009  0.0018  ±0.18%  1170103
   · node-protodef               164,894.88  0.0055  0.2990  0.0061  0.0062  0.0097  0.0112  0.0148  ±0.24%    82448
   · node-protodef (compiled)  2,364,114.03  0.0002  1.0754  0.0004  0.0004  0.0011  0.0013  0.0040  ±0.58%  1182058

 ✓ tests/benchmark.bench.ts > size + write 2180ms
     name                              hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · protodef-ts               388,770.29  0.0019  0.8373  0.0026  0.0023  0.0092  0.0110  0.0139  ±0.95%   194388
   · node-protodef              65,553.96  0.0131  0.5216  0.0153  0.0146  0.0304  0.0327  0.0444  ±0.47%    32778
   · node-protodef (compiled)  792,205.69  0.0011  0.4413  0.0013  0.0012  0.0024  0.0027  0.0060  ±0.32%   396103

 ✓ tests/benchmark.bench.ts > read 2560ms
     name                                hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · protodef-ts                 935,392.98  0.0008  0.3904  0.0011  0.0010  0.0021  0.0022  0.0047  ±0.29%   467697
   · node-protodef               100,857.46  0.0083  0.5014  0.0099  0.0094  0.0209  0.0216  0.0281  ±0.44%    50430
   · node-protodef (compiled)  1,435,550.26  0.0006  0.3979  0.0007  0.0007  0.0014  0.0015  0.0026  ±0.38%   717776

 BENCH  Summary

  node-protodef (compiled) - tests/benchmark.bench.ts > size
    1.01x faster than protodef-ts
    14.34x faster than node-protodef

  node-protodef (compiled) - tests/benchmark.bench.ts > size + write
    2.04x faster than protodef-ts
    12.08x faster than node-protodef

  node-protodef (compiled) - tests/benchmark.bench.ts > read
    1.53x faster than protodef-ts
    14.23x faster than node-protodef
```
