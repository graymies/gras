String.prototype.isNumeric = function() {
    var expression = /^[0-9]+$/;
    if (expression.test(this)) {
        return true;
    } else {
        return false;
    }
};
String.prototype.isEmpty = function() {
    if (this == null || this.length == 0) {
        return false;
    } else {
        return true;
    }
};

CALCULATRICE = function(options) {
    var fnc = prototype = {
        options: {
            // Fichier de config générale
            urlConfigGenerale: null,
            option: 0,
            montant: 0
        },

        configGenerale: null,
        configPartenaire: null,
        urlConfigPartenaire: null,
        nbrOnglet: 0,
        gabaritOption: null,
        montant: 0,
        option: 0,
        xopt: 0,
        idPartenaire: null,
        dateFinancement: null,
        dateBlocage: null,
        datePremiereEcheance: null,
        tna: 0,
        quantieme: 22,
        jourPremiereEcheance: 5,
        nbEcheance: 0,
        taeg: null,
        taegRecalcul: null,
        taegRecalcul2: null,
        echeance: Array(),
        echeance2: Array(),
        montantTotalDu: 0,
        montantTotalDu2: 0,
        derniereMens: 0,
        derniereMens2: 0,

        initialize: function(options) {
            this.options.urlConfigGenerale = options.urlConfigGenerale;
            this.options.option = options.option;
            this.options.montant = options.montant;

            /*this.nbrOnglet = $('#calcMenu li').length;
            $('#calcMenu').addClass('grid'+this.nbrOnglet);*/
            $('#tabCalc div[id^="content_"]').hide();
            this.activeOnglet(0); // On active le premier onglet par défaut
            this.gabaritOption = $('#options li:first-child'); // Création des gabarits pour l'affichage des réponses

            // Récupération du montant
            this.montant = this.getParametreUrl('montant');
            if (typeof(this.montant) == 'undefined') {
                this.montant = this.options.montant;
            }
            this.montant = parseFloat(this.montant.replace(",", "."));
            $('#montant').val(this.montant);

            // Récupération de l'option
            this.option = this.getParametreUrl('option');
            if (typeof(this.option) == 'undefined') {
                this.option = this.options.option;
            }

            // Récupération de xopt
            this.xopt = this.getParametreUrl('xopt');
            if (typeof(this.xopt) == 'undefined') {
                this.xopt = null;
            }

            // Récupération du partenaire
            this.idPartenaire = this.getIdPartenaire(this.getParametreUrl('idPartenaire'));
            if (this.idPartenaire == null) {
                this.idPartenaire = 'generique';
            }

            this.urlConfigPartenaire = "partenaires/" + this.idPartenaire.toLowerCase() + "/config-" + this.idPartenaire.toLowerCase() + ".xml";
            $('#logoPartenaire').attr('src', 'partenaires/' + this.idPartenaire.toLowerCase() + '/logo-partenaire.jpg');

            this.setDateFinancement();
            this.setDateBlocage();
            this.setDatePremiereEcheance();
            this.getConfigGenerale();
            this.eventInput();
            return this;
        },

        /* evenements sur input :: focus, blur, click... */
        eventInput: function() {
            var obj = this;

            $('#btCalcul').on('click', function(event) {
                obj.nothing(event);
                obj.montant = parseFloat($('#montant').val().replace(",", "."));
                console.log("lemontant = " + obj.montant);
                if (obj.verifMontant()) {
                    obj.moteurCalcul();
                } else {
                    obj.messageErreur();
                }
            });

            $('#montant').on('keypress', function(event) {
                if (event.which == 13) {
                    obj.montant = parseFloat($('#montant').val().replace(",", "."));
                    if (obj.verifMontant()) {
                        obj.moteurCalcul();
                    } else {
                        obj.messageErreur();
                    }
                }
            });


            $('#continue').on('click', function(event) {
                obj.nothing(event);
                $(window).close();
            });

            $('#calcMenu li').on('click', function(index, event) {
                var index = $(this).index();
                /** Gestion onglet **/
                obj.activeOnglet(index);
            });

            $('#options li').on('click', function(index, event) {
                var index = $(this).index();
                /** Gestion options **/
                obj.choixOptions(index);
            });

        },

        activeOnglet: function(indexOnglet) {
            $('#tabCalc div[id^="content_"]').hide();
            $('#calcMenu li').removeClass('actif').removeClass('radiusbg').removeClass('radiusbd');
            $('#calcMenu li:eq(' + (indexOnglet) + ')').addClass('actif');
            $('#tabCalc div[id^="content_"]:eq(' + indexOnglet + ')').show();
            if (indexOnglet > 0 && indexOnglet < (this.nbrOnglet - 1)) {
                $('#calcMenu li:eq(' + (indexOnglet - 1) + ')').addClass('radiusbd');
                $('#calcMenu li:eq(' + (indexOnglet + 1) + ')').addClass('radiusbg');
            } else if (indexOnglet == 0) {
                $('#calcMenu li:eq(' + (indexOnglet + 1) + ')').addClass('radiusbg');
            } else if (indexOnglet == (this.nbrOnglet - 1)) {
                $('#calcMenu li:eq(' + (indexOnglet - 1) + ')').addClass('radiusbd');
            }
        },

        choixOptions: function(indexOnglet) {
            $('#options li').removeClass('actif');
            $('#options li:eq(' + (indexOnglet) + ')').addClass('actif');
            //$('#optionContent p').hide();
            this.option = $('#options li:eq(' + (indexOnglet) + ')').attr('id');

            if (this.verifMontant()) {
                this.moteurCalcul();
            } else {
                this.messageErreur();
            }
        },

        getConfigGenerale: function() {
            var obj = this;

            classIdPartenaire = obj.idPartenaire.replace(/[0-9]/, "");
            console.log(classIdPartenaire);

            //$('#calculatrice').addClass(obj.idPartenaire);
            $('#calculatrice').addClass(classIdPartenaire);
            $.ajax({
                type: "GET",
                url: this.options.urlConfigGenerale,
                dataType: "xml",
                async: false,
                error: function() {
                    alert('Impossible de récupérer le xml');
                }
            }).done(function(data) {
                obj.parseConfigGenerale(data);
                obj.getConfigPartenaire();
            });
        },

        parseConfigGenerale: function(data) {
            this.configGenerale = data;

            var xmlData = $(this.configGenerale);
            /* Ajout des mentions */
            var mention1 = xmlData.find('corpstexte').text();
            var mention2a = xmlData.find('mention1').text();
            var mention2b = xmlData.find('mention2').text();
            //var mention2c = xmlData.find('mention_comptant').text();
            $('.mention1').html(mention1);
            $('.mention2').html(mention2a + '<br />' + mention2b);
        },

        getConfigPartenaire: function() {
            var obj = this;

            $.ajax({
                type: "GET",
                url: this.urlConfigPartenaire,
                dataType: "xml",
                async: false,
                error: function() {
                    alert('Impossible de récupérer le xml');
                }
            }).done(function(data) {
                obj.parseConfigPartenaire(data);
            });
        },

        getIdPartenaire: function(pPartenaire) {
            var idPartenaire;
            if (!isNaN(pPartenaire)) { //à MAJ avec Borg/part 4xCB
                switch (pPartenaire) {
                    case "amazon":
                    case "08000056880":
                        idPartenaire = 'amazon';
                        break;
                    default:
                        idPartenaire = 'generique';
                }
            } else {
                (typeof(pPartenaire) == 'undefined') ? idPartenaire = null: idPartenaire = pPartenaire;
            }
            return idPartenaire;
        },

        parseConfigPartenaire: function(data) {
            var obj = this;

            obj.configPartenaire = data;

            var xmlDataPartenaire = $(obj.configPartenaire);
            var xmlDataGeneral = $(obj.configGenerale);
            /* Ajout des options */
            var optionPartenaire = xmlDataPartenaire.find('option[valeur="on"]');

            /* Gestion nom partenaire */
            var nomPartenaire = xmlDataPartenaire.find('partenaire').text();
            //console.log('MEA  partenaire : '+nomPartenaire);

            if (nomPartenaire.length == 0 || nomPartenaire.length == 'generique') {
                nomPartenaire = '';
                $('#nomPartenaire').html(nomPartenaire);
            } else if (nomPartenaire.length != 0 && nomPartenaire.length != 'generique') {
                $('#nomPartenaire').html(nomPartenaire);
            }

            /* Gestion des bannieres */
            var bannierePartenaire = xmlDataPartenaire.find('banniere');
            var banniereContent = '';

            if (bannierePartenaire.attr('source').length != 0) {
                if (bannierePartenaire.attr('cible').length != 0) {
                    banniereContent = '<a href="' + bannierePartenaire.attr('cible') + '" title="">';
                }
                banniereContent += '<img src="images/bannieres/' + bannierePartenaire.attr('source') + '" alt="" />';
                if (bannierePartenaire.attr('cible').length != 0) {
                    banniereContent += '</a>';
                }
                $('#banniere').html(banniereContent);
            }
            $('#partenaire').html(xmlDataPartenaire.find('partenaire').attr('texte'));


            /* Gestion onglet "Beneficier" et "Avantage" */
            if (xmlDataPartenaire.find('fonctionnement etape').length == 0) {
                $('#beneficier').remove();
            }
            if (xmlDataPartenaire.find('avantages avantage').length == 0) {
                $('#avantages').remove();
            }

            obj.nbrOnglet = $('#calcMenu li').length;
            $('#calcMenu').addClass('grid' + obj.nbrOnglet);

            /* On affiche les options */
            optionPartenaire.each(function() {
                var idOption = $(this).attr('id');
                if (idOption != obj.xopt) {
                    var libelleOption = xmlDataGeneral.find('option[id="' + idOption + '"]').attr('libelle');
                    var liOption = $('<li id="' + idOption + '"><span>' + libelleOption + '</span></li>');
                    obj.options.option = idOption; // MAJ 16/02/2016
                    obj.option = idOption; // MAJ 16/02/2016

                    if (idOption == obj.option) {
                        $(liOption).addClass('actif');
                    }
                    $('#options').append(liOption);
                }
            });

            /* Gestion de la largeur des options dans le HTML */
            var nbOptions = $('#options li').length;
            $('#options').addClass('grid' + nbOptions);

            if (obj.verifMontant()) {
                obj.moteurCalcul();
            } else {
                obj.messageErreur();
            }

            //obj.parseFonctionnement();
            //obj.parseAvantages();

        },

        verifMontant: function() {
            var obj = this;
            var xmlDataPartenaire = $(obj.configPartenaire);
            $('#optionContent p').hide();

            var montantMin = xmlDataPartenaire.find('option[id="' + obj.option + '"]').attr('min');
            var montantMax = xmlDataPartenaire.find('option[id="' + obj.option + '"]').attr('max');

            if ((obj.montant >= montantMin) && (obj.montant <= montantMax)) {
                return true;
            } else {
                return false
            };
        },

        messageErreur: function() {
            var obj = this;
            var xmlDataPartenaire = $(obj.configPartenaire);
            var xmlDataGeneral = $(obj.configGenerale);
            var montantMin = xmlDataPartenaire.find('option[id="' + obj.option + '"]').attr('min');
            var montantMax = xmlDataPartenaire.find('option[id="' + obj.option + '"]').attr('max');
            var libelleOption = xmlDataGeneral.find('option[id="' + obj.option + '"]').attr('libelle');

            var message = "";
            switch (obj.option) {
                case "5":
                    message = 'Pour le paiement en petites mensualités, le montant doit être compris entre ' + montantMin + '€ et ' + montantMax + '€';
                    break;
                case "0":
                    message = 'Pour le paiement "Comptant", le montant doit être compris entre ' + montantMin + '€ et ' + montantMax + '€';
                    break;
                default:
                    message = 'Pour le paiement en "' + libelleOption + '", le montant doit être compris entre ' + montantMin + '€ et ' + montantMax + '€';
                    break;
            }

            $('#optionContent p').show().html(message);
        },

        parseFonctionnement: function() {
            var obj = this;

            var xmlDataPartenaire = $(obj.configPartenaire);
            var etape = null;
            xmlDataPartenaire.find('fonctionnement etape').each(function(index) {
                etape = "<li><span class='bullet'>" + (index + 1) + "</span><p>";
                if ($(this).attr('picto') != '') {
                    etape += "<img src='partenaires/" + obj.idPartenaire.toLowerCase() + "/beneficier/" + $(this).attr('picto') + "' alt='' width='75px' />";
                }
                etape += "<span class='texte'>" + $(this).text() + "</span></p>";
                etape += "</li>"
                $('.fonctionnement').append(etape);
            })

        },

        parseAvantages: function() {
            var obj = this;

            var xmlDataPartenaire = $(obj.configPartenaire);
            var etape = null;
            xmlDataPartenaire.find('avantages avantage').each(function(index) {
                //etape = "<li><span class='bullet'>"+(index+1)+"</span>";
                etape = "<li><p>";
                if ($(this).attr('picto') != '') {
                    etape += "<img src='partenaires/" + obj.idPartenaire.toLowerCase() + "/avantages/" + $(this).attr('picto') + "' alt='' width='75px' />";
                }
                etape += "<span class='texte'>" + $(this).text() + "</span></p>";
                etape += "</li>"
                $('.avantages').append(etape);
            })
        },

        moteurCalcul: function() {
            var obj = this;

            var xmlDataPartenaire = $(obj.configPartenaire);
            var xmlDataGeneral = $(obj.configGenerale);

            var coef = parseFloat(xmlDataGeneral.find('option[id="' + obj.option + '"]').attr('coef'));
            obj.taeg = xmlDataGeneral.find('option[id="' + obj.option + '"]').attr('teg');
            obj.nbEcheance = xmlDataGeneral.find('option[id="' + obj.option + '"]').attr('nbEcheances');

            if ((obj.option == 1) || (obj.option == 2) || (obj.option == 3) || (obj.option == 5)) { // 4xCB
                var ma_simu = '';
                var mens_1 = 0;

                /*var frais = obj.truncateDecimals(obj.montant*coef, 2);
                var fraisTaux = (coef*100).toFixed(2);
                var montant_total_du = obj.montant+frais ;
                var mens_n = obj.truncateDecimals(montant_total_du/obj.nbEcheance, 2);*/

                var fraisTaux = (coef * 100).toFixed(2);
                var mens_n0 = (obj.montant * (1 + fraisTaux / 100) / 4) * 100;
                var mens_n = (Math.floor(mens_n0) / 100).toFixed(2);
                var montant_total_du = (mens_n * 4).toFixed(2);
                var frais = (montant_total_du - obj.montant).toFixed(2);

                // mens_1 = Math.round( ((obj.montant-((obj.nbEcheance-1)*mens_n))+frais)*100)/100;


                console.log('************************************************************************************************************');
                console.log('****                                                                                                    ****');
                console.log("****    montant :: " + obj.montant + " // coef :: " + coef + " (" + fraisTaux + ") ==> frais :: " + frais);
                console.log("****    totalDu :: " + montant_total_du + " // autresMens :: " + mens_n);
                console.log('****                                                                                                    ****');
                console.log('************************************************************************************************************');

                /*ma_simu = "1ère mensualité de "+mens_1+"€ et "+(obj.nbEcheance-1)+" autres mensualités de "+mens_n+"€<br />";
                ma_simu += "Montant total dû : "+montant_total_du+"€. ";
                if( coef != 0 ){
                	ma_simu += "Frais : "+(coef*100)+"% du montant de l'achat. <br />";
                }
                else{
                	ma_simu += "";
                }*/

                //$('#optionContent p').html(ma_simu);

                $('#recap .montant').html(obj.montant);
                $('#recap .nbMensualites').html(obj.nbEcheance);
                // $('#recap .mens-1').html(mens_1);
                $('#recap .mens-n').html(mens_n);
                $('#recap .montant-total-du').html(montant_total_du);
                $('#recap .frais-taux').html(fraisTaux);
                $('#recap .frais').html(frais);


            } else { // Sinon paiement en Nfois

                obj.setObjEcheance();

                if (obj.taegRecalcul <= (obj.taeg / 100)) {
                    var recap = obj.getTableau1();
                    var derniereMensualite = obj.derniereMens;
                    var montantTotalDu = obj.montantTotalDu;
                    var taeg = (obj.taegRecalcul * 100).toFixed(2);
                } else {
                    var recap = obj.getTableau2();
                    var derniereMensualite = obj.derniereMens2;
                    var montantTotalDu = obj.montantTotalDu2;
                    var taeg = (obj.taegRecalcul2 * 100).toFixed(2);
                }
                //console.log("taeg = "+(obj.taeg)+" | taeg recalcul 1 = "+(obj.taegRecalcul)+" | taeg recalcul 2 ="+(obj.taegRecalcul2));
                $('#optionContent p').html((obj.nbEcheance - 1) + " mensualités de " + recap[1].mensualite + "€ et une dernière mensualité de " + derniereMensualite + "€<br />Montant total dû : " + montantTotalDu.toFixed(2) + "€ TAEG fixe : " + taeg + "%<br /><br />Cette simulation s'entend pour un financement le " + obj.formatDate(obj.getDateFinancement()) + " et une première échéance le " + obj.formatDate(obj.getDatePremiereEcheance()));
            }
        },



        calculTaegBis: function() {
            obj = this;
            var taegRecalcule = 1;
            var taegRecalcule2 = 1;


            var k = 1.0;
            var N = 0.0;
            var M = 1.0;

            var sommeMens = 0;
            var sommeMens2 = 0;

            do {
                sommeMens = 0;
                for (j = 1; j <= obj.nbEcheance; j++) {
                    obj.echeance[j].mensActualise = ((obj.echeance[j].capitalRembourse + obj.echeance[j].interet) / Math.pow((1 + k), (obj.echeance[j].nbMois / 12)));
                    sommeMens += obj.echeance[j].mensActualise;
                }

                if ((sommeMens - obj.montant) > 0) {
                    N = k;
                    M = M;
                } else {
                    N = N;
                    M = k;
                }
                k = (N + M) / 2;
            } while (Math.abs(M - N) > 0.0000000000001);


            taegRecalcule = k / 100;
            k = 1;
            N = 0;
            M = 1;
            i = 0.00005;
            Z = 1;
            var tx2 = obj.tna;
            var tx3 = taegRecalcule;
            obj.taegRecalcul = taegRecalcule * 100;
            tna2 = tx2;
            while (((parseFloat(taegRecalcule2.toFixed(4))) > (obj.taeg / 100)) && (Z < 50)) {
                tx2 = tx2 - i;
                if (obj.tna > 0) {
                    tna2 = tx2;
                }
                k = 1;
                N = 0;
                M = 1;
                taegRecalcule2 = k;
                do {
                    sommeMens2 = 0;
                    mensualite = obj.echeance[1].mensualite;
                    var capDebPer = obj.montant;
                    obj.montantTotalDu2 = 0;
                    for (a = 1; a <= obj.nbEcheance; a++) {
                        obj.echeance2[a] = new Object();

                        //Capital Debut période
                        obj.echeance2[a].capitalDebutPeriode = capDebPer;

                        // Interet
                        var nbrJourAnnee = obj.getNbrJourAnnee((obj.echeance[a].datePrelevement).getFullYear());
                        obj.echeance2[a].nbJour = parseInt(obj.echeance[a].nbJour);
                        obj.echeance2[a].interet = obj.truncateDecimals((tna2 / nbrJourAnnee) * obj.echeance2[a].capitalDebutPeriode * obj.echeance2[a].nbJour, 2);

                        // Mensualite
                        if (a < obj.nbEcheance) {
                            obj.echeance2[a].mensualite = parseFloat(mensualite.toFixed(2));
                        } else {
                            obj.echeance2[a].mensualite = parseFloat((obj.echeance2[a].capitalDebutPeriode + obj.echeance2[a].interet).toFixed(2));
                        }
                        //Capital remboursé
                        obj.echeance2[a].capitalRembourse = parseFloat((obj.echeance2[a].mensualite - parseFloat(obj.echeance2[a].interet)).toFixed(2));

                        // Recalcul du capital début période
                        capDebPer = obj.echeance2[a].capitalDebutPeriode - obj.echeance2[a].capitalRembourse;


                        obj.echeance2[a].mensActualise = ((obj.echeance2[a].capitalRembourse + obj.echeance2[a].interet) / Math.pow((1 + k), (obj.echeance[a].nbMois / 12)));
                        sommeMens2 += obj.echeance2[a].mensActualise;

                        obj.montantTotalDu2 += obj.echeance2[a].mensualite;
                        obj.derniereMens2 = obj.echeance2[a].mensualite;

                    }

                    if ((sommeMens2 - obj.montant) > 0) {
                        N = k;
                        M = M;
                    } else {
                        N = N;
                        M = k;
                    }
                    k = (N + M) / 2;
                } while (Math.abs(M - N) > 0.0000000000001);

                Z = Z + 1;

                taegRecalcule2 = k;
                obj.taegRecalcul2 = taegRecalcule2;
            }
        },

        setObjEcheance: function() {
            obj = this;
            var dateFinancement = new Date(obj.getDateFinancement());

            var dateFinancementDecale = new Date(obj.getDateFinancement());
            dateFinancementDecale = obj.decaleMois(dateFinancementDecale, 1);

            var datePrelevement = new Date(obj.getDatePremiereEcheance());

            var datePrelevementPrecedente = new Date(obj.getDatePremiereEcheance());
            datePrelevementPrecedente = obj.decaleMois(datePrelevementPrecedente, -1);

            var nbJour = obj.getNbrJour(datePrelevement, dateFinancement);

            var capDebPer = parseFloat(obj.montant);

            var mensualite = 0;
            obj.tna = obj.getTna();
            (obj.tna > 0) ? mensualite = obj.truncateDecimals((obj.montant / ((1 - (1 / (Math.pow((1 + (obj.tna / 12)), obj.nbEcheance)))) / (obj.tna / 12))), 2): mensualite = obj.truncateDecimals((obj.montant / obj.nbEcheance), 2);
            obj.montantTotalDu = 0;
            for (i = 1; i <= obj.nbEcheance; i++) {
                obj.echeance[i] = new Object();

                /** nbMois recalculé **/
                if (i == 1) {
                    if (dateFinancementDecale.getTime() == obj.datePremiereEcheance.getTime()) {
                        obj.echeance[i].nbMois = 1;
                    } else {
                        if (dateFinancement.getDate() > obj.jourPremiereEcheance && dateFinancement.getDate() <= obj.quantieme) {
                            var nbrMois = (nbJour * 12);
                        } else {
                            var nbJourDate1 = obj.getNbrJour(obj.getDatePremiereEcheance(), dateFinancementDecale);
                            var jourAnnee1 = new Date(obj.getDateFinancement());
                            jourAnnee1.setDate(31);
                            jourAnnee1.setMonth(11);
                            var jourAnnee2 = new Date(jourAnnee1);
                            jourAnnee2.setDate(31);
                            jourAnnee2.setMonth(11);
                            jourAnnee2.setFullYear(jourAnnee2.getFullYear() - 1)
                            var nbJourDate2 = obj.getNbrJour(jourAnnee1, jourAnnee2);

                            var nbrMois = 1 + ((nbJourDate1 * 12) / nbJourDate2);
                            obj.echeance[i].nbMois = parseFloat(nbrMois.toFixed(5));
                        }
                    }
                } else {
                    var nbrMois = parseFloat((obj.echeance[i - 1].nbMois)) + 1
                    obj.echeance[i].nbMois = parseFloat(nbrMois.toFixed(3));
                    nbJour = obj.getNbrJour(datePrelevement, datePrelevementPrecedente);
                }

                //Capital Debut période
                obj.echeance[i].capitalDebutPeriode = parseFloat(capDebPer.toFixed(2));

                // Interet
                obj.echeance[i].nbJour = nbJour;
                obj.echeance[i].datePrelevement = datePrelevement;
                var nbrJourAnnee = obj.getNbrJourAnnee((obj.echeance[i].datePrelevement).getFullYear());
                obj.echeance[i].interet = obj.truncateDecimals((obj.tna / nbrJourAnnee) * parseFloat(obj.echeance[i].capitalDebutPeriode) * nbJour, 2);

                // Mensualite
                if (i < obj.nbEcheance) {
                    obj.echeance[i].mensualite = parseFloat(mensualite.toFixed(2));
                } else {
                    obj.echeance[i].mensualite = parseFloat((obj.echeance[i].capitalDebutPeriode + obj.echeance[i].interet).toFixed(2));
                }

                //Capital remboursé
                obj.echeance[i].capitalRembourse = parseFloat((obj.echeance[i].mensualite - parseFloat(obj.echeance[i].interet)).toFixed(2));

                // Recalcul du capital début période
                capDebPer = obj.echeance[i].capitalDebutPeriode - obj.echeance[i].capitalRembourse;

                datePrelevement = obj.decaleMois(datePrelevement, 1);
                datePrelevementPrecedente = obj.decaleMois(datePrelevementPrecedente, 1);
                obj.montantTotalDu += obj.echeance[i].mensualite;
                obj.derniereMens = obj.echeance[i].mensualite;
            }
            obj.calculTaegBis();

        },

        getTableau1: function() {
            return obj.echeance;
        },

        getTableau2: function() {
            return obj.echeance2;
        },

        getNbrJour: function(date1, date2) {
            return parseFloat((((date1.getTime() - date2.getTime()) / 1000) / 3600 / 24).toFixed());
        },

        getNbrJourAnnee: function(annee) {
            //var annee = this.getDateFinancement().getFullYear();
            var date1 = new Date(annee, 12, 31);
            var date2 = new Date(annee - 1, 12, 31);
            return this.getNbrJour(date1, date2);
        },

        decaleMois: function(date, mois) {
            var maDate = new Date(date.getFullYear(), date.getMonth() + mois, date.getDate());
            if ((maDate.getMonth() - date.getMonth()) > 1) {
                maDate.setDate(1);
                maDate.setTime(maDate.getTime() - (24 * 3600 * 1000));
            }
            return maDate;
        },

        /** Gestion de la date du jour **/
        setDateFinancement: function() {
            this.dateFinancement = new Date();
            this.dateFinancement.setHours(0);
            this.dateFinancement.setMinutes(0);
            this.dateFinancement.setSeconds(0);
            this.dateFinancement.setMilliseconds(0);
            if (this.dateFinancement.getDate() < 5) {
                this.dateFinancement.setDate(5);
            } else if (this.dateFinancement.getDate() > 5) {
                this.dateFinancement.setDate(5);
                this.dateFinancement.setMonth(this.dateFinancement.getMonth() + 1);
            }
        },

        getDateFinancement: function() {
            return this.dateFinancement;
        },


        /** Gestion de la date de blocage **/
        setDateBlocage: function() {
            var maDateBlocage = new Date(this.getDateFinancement());

            if (maDateBlocage.getDate() > this.quantieme) {
                maDateBlocage.setDate(this.quantieme);
                maDateBlocage = this.decaleMois(maDateBlocage, 1);
            }
            this.dateBlocage = maDateBlocage;
        },

        getDateBlocage: function() {
            return this.dateBlocage;
        },

        /** Gestion de la date de première écheance **/
        setDatePremiereEcheance: function() {
            var maDate = new Date(this.getDateBlocage());
            maDate.setDate(this.jourPremiereEcheance);
            maDate = this.decaleMois(maDate, 1);
            this.datePremiereEcheance = maDate;
        },

        getDatePremiereEcheance: function() {
            return this.datePremiereEcheance;
        },


        /** Formatage d'une date **/
        formatDate: function(date) {
            var dateFormat;
            (date.getDate() < 10) ? dateFormat = "0" + date.getDate() + "/": dateFormat = date.getDate() + "/";
            ((date.getMonth() + 1) < 10) ? dateFormat += "0" + (date.getMonth() + 1): dateFormat += (date.getMonth() + 1);
            dateFormat += "/" + date.getFullYear();
            return dateFormat;
        },

        getTna: function() {
            var tna = ((Math.pow((1 + (this.taeg / 100)), (1 / 12))) - 1) * 12;
            return tna.toFixed(10);
        },

        truncateDecimals: function(valeur, digits) {
            var multiplier = Math.pow(10, digits);
            adjustedNum = valeur * multiplier;
            return parseInt(adjustedNum) / multiplier;
        },

        vCopyDate: function(variable) {
            var monobjet = new Date();
            $.extend(true, variable, monobjet);
            return monobjet;
        },

        no_accent: function(my_string) {
            var new_string = "";
            var pattern_accent = new Array(233, 232, 234, 235, 231, 224, 226, 228, 238, 239, 249, 244, 246);
            var pattern_replace_accent = new Array("e", "e", "e", "e", "c", "a", "a", "a", "i", "i", "u", "o", "o");
            if (my_string && my_string != "") {
                new_string = this.preg_replace(pattern_accent, pattern_replace_accent, my_string);
            }
            return new_string;
        },

        preg_replace: function(array_pattern, array_pattern_replace, my_string) {
            var new_string = String(my_string);
            var new_string_modif = "";
            for (j = 0; j < new_string.length; j++) {
                var caractere = new_string[j];
                var caractere_code = new_string.charCodeAt(j);
                for (i = 0; i < array_pattern.length; i++) {
                    if (caractere_code == array_pattern[i]) {
                        var val_to_replace = array_pattern_replace[i];
                        caractere = val_to_replace;
                    }
                }
                new_string_modif += caractere;
            }
            return new_string_modif;
        },

        nothing: function(event) {
            event.preventDefault();
            event.stopPropagation();
        },

        getParametreUrl: function(pParam) {
            var paramARecuperer;
            var nom = new Array();
            var valeur = new Array();
            param = window.location.search.slice(1, window.location.search.length);
            first = param.split("&");
            for (i = 0; i < first.length; i++) {
                second = first[i].split("=");
                nom[i] = second[0];
                valeur[nom[i]] = second[1];
            }
            paramARecuperer = valeur[pParam];
            return paramARecuperer;
        },
    }
    return fnc.initialize(options);
};

$(document).ready(function() {
    calc = new CALCULATRICE({
        urlConfigGenerale: "xml/4cb/config-generale-4cb.xml",
        option: 1,
        montant: 300
    });
});