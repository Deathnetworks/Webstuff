<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Mee's Stuff</title>
    <style>
      body {
        background: #222;
        color: #aaa;
        font-family: Georgia;
        font-size: 1.1rem;
        line-height: 1.5;
      }
      a {
        color: #ff0;
      }
      a:hover {
        text-decoration: none;
      }
    </style>
</head> 
<body> 

<div id="mainWrapper">
  <header id="mainHeader"> 
    <h1>Mee's Stuff</h1>
  </header> 

  <div id="clearf content"> 
    <ul>
      <?php
      $dirs = array_filter(glob('*'), 'is_dir');

      foreach($dirs as $var): ?>
      <li><a href="./<?php echo $var ?>"><?php echo $var ?></a></li>
      <?php endforeach?>

    </ul>
 
  </div> 

</div>
</body> 
</html>