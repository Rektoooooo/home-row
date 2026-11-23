/* ===== Word data (hand-compiled, grouped by kind; lowercase letters only) =====
   WORDS_CORE  = everyday words, used by Test "Common 200" and weighted first everywhere.
   WORDS_MORE  = a wider everyday vocabulary, used by Test "Common 1000" (CORE + MORE) and by lessons/practice. */
const WORDS_CORE = (
  // function words
  "a about after again all also always an and any are as at away back be because been before but by can could day " +
  "did do does down each even every few first for from get give go good great had has have he her here him his how " +
  "i if in into is it its just know last let life like little long look made make man many may me more most much " +
  "must my never new next no not now of off old on once one only or other our out over own part people place put " +
  "right said same say see she should show small so some still such take tell than that the their them then there " +
  "these they thing think this those three time to too two under up us use very want was water way we well went " +
  "were what when where which while who why will with word work world would year yes yet you your " +
  // basic content words
  "home hand eye head house room night name school child woman week call try ask need feel leave mean keep begin " +
  "seem help talk turn start hear play run move live find come big high large young early late open read write"
).split(" ");

const WORDS_MORE = (
  // more function words and adverbs
  "above across against almost along already among another around behind being below between both during either " +
  "else enough ever far hers inside least less maybe near neither none nor often onto per quite rather several " +
  "shall since soon though through thus till today together tomorrow tonight toward until upon usually whether whom " +
  "whose within without yesterday carefully easily gently happily quickly quietly really slowly suddenly " +
  // verbs
  "accept act add agree allow answer appear apply argue arrive attack avoid bake become believe belong bend bite " +
  "blow boil borrow break bring build burn buy care carry catch cause change check choose clean climb close collect " +
  "compare cook copy cost count cover create cross cry cut dance deal decide deliver depend describe design dig " +
  "discover divide draw dream dress drink drive drop dry earn eat enjoy enter escape exist expect explain fall feed " +
  "fight fill finish fit fix float fly fold follow forget forgive form gather glow grab grow guess hang happen hate " +
  "hide hit hold hope hunt hurry imagine improve include invite join jump kick knock laugh lay lead lean learn lend " +
  "lie lift listen lose love manage mark matter measure meet melt mind miss mix notice obey offer order pack paint " +
  "pass pay pick plan plant point pour prefer prepare press print promise protect prove pull push raise reach relax " +
  "remember repeat reply rest return ride ring rise roll rush save search sell send serve set shake share shine " +
  "shout shut sign sing sink sit skip sleep slide smell smile solve sort speak spend spill split spread stand stay " +
  "stick stop study succeed suggest supply support suppose swim talk taste teach tear thank throw touch train travel " +
  "treat trust type understand visit vote wait wake walk warn wash watch wave wear win wish wonder worry " +
  "asked called came felt found gave got heard kept knew left meant met paid ran sat saw seen sent shown sold spoke " +
  "stood taken thought told took tried used wrote going doing making being looking working typing playing having " +
  "getting coming taking giving trying " +
  // nouns
  "age air animal apple area arm art baby bag ball band bank bar base bath beach bed bell bird birth blood boat body " +
  "bone book border bottle bottom box boy brain branch bread bridge brother bus business cake camera camp car card " +
  "case cat chair chance circle city class clock cloud club coast coat coffee color corner country course cousin cup " +
  "dad daughter desk dinner dog door earth edge egg end energy evening event face fact family farm father field film " +
  "fire fish flag floor flower food foot forest friend fruit future game garden gate gift girl glass gold grass " +
  "ground group hair half hall hat heart heat hill history hole horse hotel hour idea island job juice key kid king " +
  "kitchen lake land language leg lesson letter level library light line lion list lunch machine map market meal " +
  "message metal milk minute moment money month moon morning mother mountain mouse mouth movie music nature neck " +
  "noise nose note number ocean office oil page pair paper park party path peace pen pencil person phone piano " +
  "picture piece plane plate pool price problem question radio rain reason river road rock roof rule salt sand " +
  "science sea season seat second shape sheep ship shirt shoe shop side silver sister size skin sky snow son song " +
  "sound soup space speed spring square star station step stone store story street student summer sun table tail " +
  "tea teacher team test ticket tooth top town toy tree trip truck uncle unit valley value village voice wall wheel " +
  "wind window wing winter wood yard keyboard finger screen habit rhythm practice progress goal " +
  "ash dash flash gas lad lag salad flask lash " +
  // adjectives
  "able afraid alive alone angry bad basic best better black blue bold brave bright broad brown busy calm careful " +
  "cheap clear clever cold common cool correct dark dear deep different dirty easy empty equal exact fair false " +
  "famous fancy fast fine flat free fresh friendly full funny gentle glad green happy hard heavy honest hot huge " +
  "humble kind lazy lively local loud lovely low lucky main major modern narrow natural neat nice noisy normal " +
  "orange plain pink polite poor popular possible pretty proud public pure purple quick quiet rapid rare raw ready " +
  "real red rich rough round royal sad safe sharp short shy silent simple slow smart smooth soft solid sorry special " +
  "steady strange strong sudden sunny super sure sweet tall thick thin tidy tiny tired true usual vast warm weak wet " +
  "white whole wide wild wise wonderful wrong yellow"
).split(" ");
